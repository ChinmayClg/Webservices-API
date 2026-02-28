const fs = require('fs');

const ownerFirstNames = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Riaan", "Krishna", "Ishaan", "Shaurya", "Diya", "Saanvi", "Aanya", "Pari", "Kavya", "Neha", "Pooja", "Riya", "Sneha", "Anjali"];
const ownerLastNames = ["Sharma", "Patel", "Singh", "Kumar", "Gupta", "Desai", "Joshi", "Mehta", "Reddy", "Nair", "Iyer", "Rao", "Menon", "Chauhan", "Verma"];

const locations = [
    { loc: "Andheri East", taluka: "Andheri", district: "Mumbai Suburban", state: "Maharashtra", pin: "400069", sro: "SRO Andheri" },
    { loc: "Koramangala", taluka: "Bangalore South", district: "Bengaluru Urban", state: "Karnataka", pin: "560034", sro: "SRO Koramangala" },
    { loc: "Sector 62", taluka: "Noida", district: "Gautam Buddha Nagar", state: "Uttar Pradesh", pin: "201309", sro: "SRO Noida" },
    { loc: "Viman Nagar", taluka: "Haveli", district: "Pune", state: "Maharashtra", pin: "411014", sro: "SRO Haveli" },
    { loc: "Gachibowli", taluka: "Serilingampally", district: "Hyderabad", state: "Telangana", pin: "500032", sro: "SRO Serilingampally" },
    { loc: "Salt Lake", taluka: "Bidhannagar", district: "North 24 Parganas", state: "West Bengal", pin: "700091", sro: "SRO Bidhannagar" },
    { loc: "Anna Nagar", taluka: "Anna Nagar", district: "Chennai", state: "Tamil Nadu", pin: "600040", sro: "SRO Anna Nagar" },
    { loc: "Satellite", taluka: "Ahmedabad City", district: "Ahmedabad", state: "Gujarat", pin: "380015", sro: "SRO Satellite" },
    { loc: "MG Road", taluka: "Indore City", district: "Indore", state: "Madhya Pradesh", pin: "452001", sro: "SRO Indore City" },
    { loc: "Edapally", taluka: "Kanayannur", district: "Ernakulam", state: "Kerala", pin: "682024", sro: "SRO Kanayannur" },
    { loc: "Bandra West", taluka: "Bandra", district: "Mumbai Suburban", state: "Maharashtra", pin: "400050", sro: "SRO Bandra" },
    { loc: "Whitefield", taluka: "KR Puram", district: "Bengaluru Urban", state: "Karnataka", pin: "560066", sro: "SRO KR Puram" },
    { loc: "Banjara Hills", taluka: "Khairatabad", district: "Hyderabad", state: "Telangana", pin: "500034", sro: "SRO Khairatabad" },
    { loc: "Okhla", taluka: "Kalkaji", district: "South East Delhi", state: "Delhi", pin: "110020", sro: "SRO Kalkaji" },
    { loc: "Thane West", taluka: "Thane", district: "Thane", state: "Maharashtra", pin: "400601", sro: "SRO Thane" }
];

const landTypes = ["Residential", "Commercial", "Agricultural"];
const statuses = ["Active", "Active", "Active", "Active", "Active", "Transferred", "Transferred", "Disputed"]; // Weighted

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

const generatedIds = new Set();
function generateId(year) {
    let id;
    do {
        const rand = Math.floor(10000 + Math.random() * 90000);
        id = `LR-${year}-${rand}`;
    } while (generatedIds.has(id));
    generatedIds.add(id);
    return id;
}

const lands = [];
const transactions = [];

for (let i = 0; i < 100; i++) {
    const year = randInt(2015, 2024);
    const day = String(randInt(1, 28)).padStart(2, "0");
    const month = String(randInt(1, 12)).padStart(2, "0");
    const regDate = `${day}/${month}/${year}`;

    const firstName = randElement(ownerFirstNames);
    const lastName = randElement(ownerLastNames);
    const ownerName = `${firstName} ${lastName}`;

    const contact = String(randInt(6000000000, 9999999999));
    const aadhaar = String(randInt(1000, 9999));

    const loc = randElement(locations);
    const survey = `SUR/${loc.taluka.substring(0, 3).toUpperCase()}/${String(randInt(1, 9999)).padStart(4, "0")}`;

    const type = randElement(landTypes);
    let area, priceSqft;
    if (type === "Agricultural") {
        area = randInt(10000, 50000);
        priceSqft = randInt(100, 500);
    } else if (type === "Commercial") {
        area = randInt(500, 5000);
        priceSqft = randInt(5000, 25000);
    } else {
        area = randInt(600, 3000);
        priceSqft = randInt(3000, 15000);
    }

    const marketValue = area * priceSqft;
    const stampDuty = Math.floor(marketValue * 0.06); // Approx 6%

    const status = randElement(statuses);
    const id = generateId(year);

    lands.push({
        registration_id: id,
        registration_date: regDate,
        year_of_registration: year,
        owner_name: ownerName,
        owner_contact: contact,
        owner_aadhaar_last4: aadhaar,
        survey_number: survey,
        location: loc.loc,
        taluka: loc.taluka,
        district: loc.district,
        state: loc.state,
        pincode: loc.pin,
        area_sqft: area,
        land_type: type,
        market_value_inr: marketValue,
        stamp_duty_inr: stampDuty,
        sub_registrar_office: loc.sro,
        status: status
    });

    if (status === "Transferred") {
        const newFirstName = randElement(ownerFirstNames);
        const newLastName = randElement(ownerLastNames);
        const newOwnerName = `${newFirstName} ${newLastName}`;

        transactions.push({
            registration_id: id,
            previous_owner: ownerName,
            new_owner: newOwnerName,
            new_owner_contact: String(randInt(6000000000, 9999999999)),
            reason: randElement(["Sale", "Inheritance", "Gift"])
        });

        // Update the current owner in the lands array to the new owner
        lands[i].owner_name = newOwnerName;
    }
}

const seedContent = `const mongoose = require("mongoose");
const Land = require("./models/Land");
const Transaction = require("./models/Transaction");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/landregistry";

const lands = ${JSON.stringify(lands, null, 2)};

const transactions = ${JSON.stringify(transactions, null, 2)};

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    await Land.deleteMany({});
    await Transaction.deleteMany({});
    console.log("Cleared existing data.");

    await Land.insertMany(lands);
    console.log(\`Seeded \${lands.length} land records.\`);

    await Transaction.insertMany(transactions);
    console.log(\`Seeded \${transactions.length} transaction(s).\`);

    await mongoose.disconnect();
    console.log("Done. Database seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err.message);
    process.exit(1);
  }
}

seed();
`;

fs.writeFileSync('C:\\Users\\Chinmay\\WebServices API\\server\\seed.js', seedContent);
console.log("seed.js updated with 100 records.");
