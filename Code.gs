// ============================================================
//  LAND REGISTRY REST API  —  Google Apps Script (Code.gs)
//  ============================================================
//  Sheets used:
//    - lands          : master land records  (18 columns)
//    - transactions   : ownership transfer log (6 columns)
//
//  Endpoints (action= query param selects the handler)
//  ──────────────────────────────────────────────────
//  action=getLands           GET  — list/filter all records
//  action=getLandById        GET  — single record by registration_id
//  action=registerLand       POST — add a new land parcel
//  action=transferOwnership  POST — change owner + log transfer
//  action=updateLand         POST — patch any updatable field
//
//  All POST actions are ALSO reachable via GET for quick
//  browser / Postman testing without a request body.
// ============================================================

// ── Column indices for "lands" sheet (0-based) ───────────────
var COL = {
  REGISTRATION_ID       : 0,
  REGISTRATION_DATE     : 1,   // e.g. 15/08/2019
  YEAR                  : 2,
  OWNER_NAME            : 3,
  OWNER_CONTACT         : 4,
  OWNER_AADHAAR_LAST4   : 5,
  SURVEY_NUMBER         : 6,
  LOCATION              : 7,
  TALUKA                : 8,
  DISTRICT              : 9,
  STATE                 : 10,
  PINCODE               : 11,
  AREA_SQFT             : 12,
  LAND_TYPE             : 13,  // Agricultural / Residential / Commercial
  MARKET_VALUE_INR      : 14,
  STAMP_DUTY_INR        : 15,
  SUB_REGISTRAR_OFFICE  : 16,
  STATUS                : 17   // Active / Transferred / Disputed
};

// ── Helpers ──────────────────────────────────────────────────

function getSheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function sheetToObjects(sheet) {
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var records = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    records.push(obj);
  }
  return records;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(msg, code) {
  return jsonResponse({ success: false, error: msg, code: code || 400 });
}

function successResponse(data, message) {
  return jsonResponse({ success: true, message: message || "OK", data: data });
}

function generateRegistrationId(year) {
  // Format: LR-YYYY-XXXXX  (five random digits)
  var rand = Math.floor(10000 + Math.random() * 90000);
  return "LR-" + year + "-" + rand;
}

function isRegistrationIdUnique(id) {
  var records = sheetToObjects(getSheet("lands"));
  for (var i = 0; i < records.length; i++) {
    if (records[i]["registration_id"] === id) return false;
  }
  return true;
}

function todayString() {
  var d = new Date();
  var dd = String(d.getDate()).padStart(2, "0");
  var mm = String(d.getMonth() + 1).padStart(2, "0");
  return dd + "/" + mm + "/" + d.getFullYear();
}

// ── doGet  —  read-only queries + browser-friendly mutations ──

function doGet(e) {
  var action = (e.parameter.action || "getLands").trim();

  if (action === "getLands")            return actionGetLands(e.parameter);
  if (action === "getLandById")         return actionGetLandById(e.parameter);
  if (action === "registerLand")        return actionRegisterLand(e.parameter);
  if (action === "transferOwnership")   return actionTransferOwnership(e.parameter);
  if (action === "updateLand")          return actionUpdateLand(e.parameter);

  return errorResponse("Unknown action: " + action);
}

// ── doPost  —  intended for programmatic clients (Postman etc.) ─

function doPost(e) {
  var params;
  try {
    params = JSON.parse(e.postData.contents);
  } catch(err) {
    params = e.parameter;
  }

  var action = (params.action || "").trim();

  if (action === "registerLand")        return actionRegisterLand(params);
  if (action === "transferOwnership")   return actionTransferOwnership(params);
  if (action === "updateLand")          return actionUpdateLand(params);

  return errorResponse("Unknown or missing action for POST: " + action);
}

// ============================================================
//  ACTION HANDLERS
// ============================================================

// ── 1.  getLands ─────────────────────────────────────────────
//  All query params are optional; each acts as an AND filter.
//  String fields use case-insensitive partial match.
//  Numeric range fields use >= / <= comparisons.
// ─────────────────────────────────────────────────────────────
function actionGetLands(p) {
  var records = sheetToObjects(getSheet("lands"));

  records = records.filter(function(r) {

    // -- string / partial-match filters --
    if (p.location          && !contains(r.location,         p.location))        return false;
    if (p.taluka            && !contains(r.taluka,           p.taluka))          return false;
    if (p.district          && !contains(r.district,         p.district))        return false;
    if (p.state             && !contains(r.state,            p.state))           return false;
    if (p.owner_name        && !contains(r.owner_name,       p.owner_name))      return false;
    if (p.land_type         && !contains(r.land_type,        p.land_type))       return false;
    if (p.sub_registrar_office && !contains(r.sub_registrar_office, p.sub_registrar_office)) return false;
    if (p.survey_number     && str(r.survey_number) !== p.survey_number)         return false;
    if (p.pincode           && str(r.pincode)       !== p.pincode)               return false;

    // -- exact-match filters --
    if (p.status            && str(r.status).toLowerCase() !== p.status.toLowerCase())       return false;

    // -- year filters --
    if (p.year              && str(r.year_of_registration) !== p.year)           return false;
    if (p.year_from         && Number(r.year_of_registration) < Number(p.year_from)) return false;
    if (p.year_to           && Number(r.year_of_registration) > Number(p.year_to))   return false;

    // -- value range filters --
    if (p.min_value         && Number(r.market_value_inr) < Number(p.min_value)) return false;
    if (p.max_value         && Number(r.market_value_inr) > Number(p.max_value)) return false;

    // -- area range filters --
    if (p.min_area          && Number(r.area_sqft)  < Number(p.min_area))  return false;
    if (p.max_area          && Number(r.area_sqft)  > Number(p.max_area))  return false;

    return true;
  });

  return successResponse(records, records.length + " record(s) found.");
}

// ── 2.  getLandById ──────────────────────────────────────────
function actionGetLandById(p) {
  if (!p.registration_id) return errorResponse("registration_id is required.");

  var records = sheetToObjects(getSheet("lands"));
  var found = records.filter(function(r) {
    return str(r.registration_id) === p.registration_id;
  });

  if (found.length === 0) return errorResponse("No land found with ID: " + p.registration_id, 404);
  return successResponse(found[0], "Land record retrieved.");
}

// ── 3.  registerLand ─────────────────────────────────────────
//  Required fields (8):
//    owner_name, owner_contact, owner_aadhaar_last4,
//    survey_number, location, taluka, district, state,
//    pincode, area_sqft, land_type, market_value_inr,
//    stamp_duty_inr, sub_registrar_office
//  Optional: registration_date (defaults to today), year
// ─────────────────────────────────────────────────────────────
function actionRegisterLand(p) {
  var required = [
    "owner_name", "owner_contact", "owner_aadhaar_last4",
    "survey_number", "location", "taluka", "district", "state",
    "pincode", "area_sqft", "land_type", "market_value_inr",
    "stamp_duty_inr", "sub_registrar_office"
  ];
  for (var i = 0; i < required.length; i++) {
    if (!p[required[i]]) return errorResponse("Missing required field: " + required[i]);
  }

  var today = p.registration_date || todayString();
  var year  = p.year  || today.split("/")[2] || new Date().getFullYear();

  var regId;
  do { regId = generateRegistrationId(year); }
  while (!isRegistrationIdUnique(regId));

  var sheet = getSheet("lands");
  sheet.appendRow([
    regId,
    today,
    year,
    p.owner_name,
    p.owner_contact,
    p.owner_aadhaar_last4,
    p.survey_number,
    p.location,
    p.taluka,
    p.district,
    p.state,
    p.pincode,
    p.area_sqft,
    p.land_type,
    p.market_value_inr,
    p.stamp_duty_inr,
    p.sub_registrar_office,
    "Active"
  ]);

  return successResponse({ registration_id: regId }, "Land registered successfully.");
}

// ── 4.  transferOwnership ────────────────────────────────────
//  Required: registration_id, new_owner_name, new_owner_contact
//  Optional: new_owner_aadhaar_last4, reason
// ─────────────────────────────────────────────────────────────
function actionTransferOwnership(p) {
  if (!p.registration_id)   return errorResponse("registration_id is required.");
  if (!p.new_owner_name)    return errorResponse("new_owner_name is required.");
  if (!p.new_owner_contact) return errorResponse("new_owner_contact is required.");

  var sheet = getSheet("lands");
  var data  = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (str(data[i][COL.REGISTRATION_ID]) === p.registration_id) {

      var prevOwner = data[i][COL.OWNER_NAME];

      sheet.getRange(i + 1, COL.OWNER_NAME          + 1).setValue(p.new_owner_name);
      sheet.getRange(i + 1, COL.OWNER_CONTACT       + 1).setValue(p.new_owner_contact);
      if (p.new_owner_aadhaar_last4) {
        sheet.getRange(i + 1, COL.OWNER_AADHAAR_LAST4 + 1).setValue(p.new_owner_aadhaar_last4);
      }
      sheet.getRange(i + 1, COL.STATUS + 1).setValue("Transferred");

      // Log to transactions sheet
      var txSheet = getSheet("transactions");
      txSheet.appendRow([
        new Date(),
        p.registration_id,
        prevOwner,
        p.new_owner_name,
        p.new_owner_contact,
        p.reason || ""
      ]);

      return successResponse(
        { registration_id: p.registration_id, new_owner: p.new_owner_name },
        "Ownership transferred successfully."
      );
    }
  }

  return errorResponse("Land not found: " + p.registration_id, 404);
}

// ── 5.  updateLand ───────────────────────────────────────────
//  Required: registration_id
//  Optional (any subset): location, taluka, district, state,
//    pincode, area_sqft, land_type, market_value_inr,
//    stamp_duty_inr, sub_registrar_office, status, owner_contact
// ─────────────────────────────────────────────────────────────
function actionUpdateLand(p) {
  if (!p.registration_id) return errorResponse("registration_id is required.");

  var updatable = {
    location             : COL.LOCATION,
    taluka               : COL.TALUKA,
    district             : COL.DISTRICT,
    state                : COL.STATE,
    pincode              : COL.PINCODE,
    area_sqft            : COL.AREA_SQFT,
    land_type            : COL.LAND_TYPE,
    market_value_inr     : COL.MARKET_VALUE_INR,
    stamp_duty_inr       : COL.STAMP_DUTY_INR,
    sub_registrar_office : COL.SUB_REGISTRAR_OFFICE,
    status               : COL.STATUS,
    owner_contact        : COL.OWNER_CONTACT
  };

  var sheet = getSheet("lands");
  var data  = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (str(data[i][COL.REGISTRATION_ID]) === p.registration_id) {
      var updated = [];
      for (var field in updatable) {
        if (p[field] !== undefined && p[field] !== "") {
          sheet.getRange(i + 1, updatable[field] + 1).setValue(p[field]);
          updated.push(field);
        }
      }
      if (updated.length === 0) return errorResponse("No valid fields provided to update.");
      return successResponse(
        { registration_id: p.registration_id, updated_fields: updated },
        "Land record updated."
      );
    }
  }

  return errorResponse("Land not found: " + p.registration_id, 404);
}

// ── Utilities ─────────────────────────────────────────────────
function contains(haystack, needle) {
  return str(haystack).toLowerCase().indexOf(needle.toLowerCase()) !== -1;
}

function str(v) { return v === null || v === undefined ? "" : String(v); }
