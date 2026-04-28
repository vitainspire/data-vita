export type StateDistricts = {
  state: string;
  code: string; // ISO 3166-2 based 2-letter state abbreviation
  districts: string[];
};

export const INDIA_LOCATIONS: StateDistricts[] = [
  {
    state: "Andhra Pradesh", code: "AP",
    districts: [
      "Alluri Sitharama Raju", "Anakapalli", "Ananthapuramu", "Annamayya",
      "Bapatla", "Chittoor", "Dr. B.R. Ambedkar Konaseema", "East Godavari",
      "Eluru", "Guntur", "Kakinada", "Krishna", "Kurnool", "Nandyal", "NTR",
      "Palnadu", "Parvathipuram Manyam", "Prakasam", "Sri Potti Sriramulu Nellore",
      "Sri Sathya Sai", "Srikakulam", "Tirupati", "Visakhapatnam",
      "Vizianagaram", "West Godavari", "YSR Kadapa",
    ],
  },
  {
    state: "Arunachal Pradesh", code: "AR",
    districts: [
      "Anjaw", "Changlang", "Dibang Valley", "East Kameng", "East Siang",
      "Itanagar Capital Complex", "Kamle", "Kra Daadi", "Kurung Kumey",
      "Lepa Rada", "Lohit", "Longding", "Lower Dibang Valley", "Lower Siang",
      "Lower Subansiri", "Namsai", "Pakke-Kessang", "Papum Pare", "Shi Yomi",
      "Siang", "Tirap", "Upper Siang", "Upper Subansiri", "West Kameng", "West Siang",
    ],
  },
  {
    state: "Assam", code: "AS",
    districts: [
      "Bajali", "Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar",
      "Charaideo", "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh",
      "Dima Hasao", "Goalpara", "Golaghat", "Hailakandi", "Hojai", "Jorhat",
      "Kamrup", "Kamrup Metropolitan", "Karbi Anglong", "Karimganj",
      "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon", "Nagaon", "Nalbari",
      "Sivasagar", "Sonitpur", "South Salmara-Mankachar", "Tamulpur",
      "Tinsukia", "Udalguri", "West Karbi Anglong",
    ],
  },
  {
    state: "Bihar", code: "BR",
    districts: [
      "Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur",
      "Bhojpur", "Buxar", "Darbhanga", "East Champaran", "Gaya", "Gopalganj",
      "Jamui", "Jehanabad", "Kaimur", "Katihar", "Khagaria", "Kishanganj",
      "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur",
      "Nalanda", "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa",
      "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi",
      "Siwan", "Supaul", "Vaishali", "West Champaran",
    ],
  },
  {
    state: "Chhattisgarh", code: "CT",
    districts: [
      "Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur",
      "Bilaspur", "Dantewada", "Dhamtari", "Durg", "Gariaband",
      "Gaurela-Pendra-Marwahi", "Janjgir-Champa", "Jashpur", "Kabirdham",
      "Kanker", "Khairagarh-Chhuikhadan-Gandai", "Kondagaon", "Korba",
      "Koriya", "Mahasamund", "Manendragarh-Chirmiri-Bharatpur",
      "Mohla-Manpur-Ambagarh Chowki", "Mungeli", "Narayanpur", "Raigarh",
      "Raipur", "Rajnandgaon", "Sakti", "Sarangarh-Bilaigarh", "Sukma",
      "Surajpur", "Surguja",
    ],
  },
  {
    state: "Goa", code: "GA",
    districts: ["North Goa", "South Goa"],
  },
  {
    state: "Gujarat", code: "GJ",
    districts: [
      "Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch",
      "Bhavnagar", "Botad", "Chhota Udaipur", "Dahod", "Dang",
      "Devbhoomi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar",
      "Junagadh", "Kheda", "Kutch", "Mahisagar", "Mehsana", "Morbi",
      "Narmada", "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot",
      "Sabarkantha", "Surat", "Surendranagar", "Tapi", "Vadodara", "Valsad",
    ],
  },
  {
    state: "Haryana", code: "HR",
    districts: [
      "Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad",
      "Gurugram", "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal",
      "Kurukshetra", "Mahendragarh", "Nuh", "Palwal", "Panchkula",
      "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar",
    ],
  },
  {
    state: "Himachal Pradesh", code: "HP",
    districts: [
      "Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu",
      "Lahaul and Spiti", "Mandi", "Shimla", "Sirmaur", "Solan", "Una",
    ],
  },
  {
    state: "Jharkhand", code: "JH",
    districts: [
      "Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum",
      "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara",
      "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu",
      "Ramgarh", "Ranchi", "Sahebganj", "Seraikela Kharsawan", "Simdega",
      "West Singhbhum",
    ],
  },
  {
    state: "Karnataka", code: "KA",
    districts: [
      "Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban",
      "Bidar", "Chamarajanagar", "Chikkaballapura", "Chikkamagaluru",
      "Chitradurga", "Dakshina Kannada", "Davangere", "Dharwad", "Gadag",
      "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal",
      "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru",
      "Udupi", "Uttara Kannada", "Vijayanagara", "Vijayapura", "Yadgir",
    ],
  },
  {
    state: "Kerala", code: "KL",
    districts: [
      "Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam",
      "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta",
      "Thiruvananthapuram", "Thrissur", "Wayanad",
    ],
  },
  {
    state: "Madhya Pradesh", code: "MP",
    districts: [
      "Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat",
      "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur", "Chachaura",
      "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar",
      "Dindori", "Guna", "Gwalior", "Harda", "Narmadapuram", "Indore",
      "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Maihar",
      "Mandla", "Mandsaur", "Morena", "Mauganj", "Narsinghpur", "Neemuch",
      "Niwari", "Pandhurna", "Panna", "Raisen", "Rajgarh", "Ratlam",
      "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur",
      "Sheopur", "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", "Ujjain",
      "Umaria", "Vidisha",
    ],
  },
  {
    state: "Maharashtra", code: "MH",
    districts: [
      "Ahmednagar", "Akola", "Amravati", "Chhatrapati Sambhajinagar",
      "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli",
      "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur",
      "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar",
      "Nashik", "Dharashiv", "Palghar", "Parbhani", "Pune", "Raigad",
      "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane",
      "Wardha", "Washim", "Yavatmal",
    ],
  },
  {
    state: "Manipur", code: "MN",
    districts: [
      "Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West",
      "Jiribam", "Kakching", "Kamjong", "Kangpokpi", "Noney", "Pherzawl",
      "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul",
    ],
  },
  {
    state: "Meghalaya", code: "ML",
    districts: [
      "East Garo Hills", "East Jaintia Hills", "East Khasi Hills",
      "Eastern West Khasi Hills", "North Garo Hills", "Ri Bhoi",
      "South Garo Hills", "South West Garo Hills", "South West Khasi Hills",
      "West Garo Hills", "West Jaintia Hills", "West Khasi Hills",
    ],
  },
  {
    state: "Mizoram", code: "MZ",
    districts: [
      "Aizawl", "Champhai", "Hnahthial", "Khawzawl", "Kolasib",
      "Lawngtlai", "Lunglei", "Mamit", "Saitual", "Serchhip", "Siaha",
    ],
  },
  {
    state: "Nagaland", code: "NL",
    districts: [
      "Chumoukedima", "Dimapur", "Kiphire", "Kohima", "Longleng",
      "Mokokchung", "Mon", "Niuland", "Noklak", "Peren", "Phek",
      "Shamator", "Tseminyu", "Tuensang", "Wokha", "Zunheboto",
    ],
  },
  {
    state: "Odisha", code: "OR",
    districts: [
      "Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh",
      "Cuttack", "Deogarh", "Dhenkanal", "Gajapati", "Ganjam",
      "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal",
      "Kendrapara", "Kendujhar", "Khurda", "Koraput", "Malkangiri",
      "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada", "Puri",
      "Rayagada", "Sambalpur", "Subarnapur", "Sundergarh",
    ],
  },
  {
    state: "Punjab", code: "PB",
    districts: [
      "Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib",
      "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar",
      "Kapurthala", "Ludhiana", "Malerkotla", "Mansa", "Moga",
      "SAS Nagar (Mohali)", "Sri Muktsar Sahib", "Pathankot", "Patiala",
      "Rupnagar", "Sangrur", "Shaheed Bhagat Singh Nagar", "Tarn Taran",
    ],
  },
  {
    state: "Rajasthan", code: "RJ",
    districts: [
      "Ajmer", "Alwar", "Anupgarh", "Balotra", "Banswara", "Baran",
      "Barmer", "Beawar", "Bharatpur", "Bhilwara", "Bikaner", "Bundi",
      "Chittorgarh", "Churu", "Dausa", "Deeg", "Dholpur",
      "Didwana-Kuchaman", "Dudu", "Dungarpur", "Gangapur City",
      "Hanumangarh", "Jaipur", "Jaipur Rural", "Jaisalmer", "Jalore",
      "Jhalawar", "Jhunjhunu", "Jodhpur", "Jodhpur Rural", "Karauli",
      "Kekri", "Khairthal-Tijara", "Kotputli-Behror", "Kota", "Nagaur",
      "Neem Ka Thana", "Pali", "Phalodi", "Pratapgarh", "Rajsamand",
      "Salumbar", "Sanchore", "Sawai Madhopur", "Shahpura", "Sikar",
      "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur",
    ],
  },
  {
    state: "Sikkim", code: "SK",
    districts: [
      "East Sikkim", "North Sikkim", "Pakyong", "Soreng",
      "South Sikkim", "West Sikkim",
    ],
  },
  {
    state: "Tamil Nadu", code: "TN",
    districts: [
      "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore",
      "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kancheepuram",
      "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai",
      "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai",
      "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi",
      "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli",
      "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai",
      "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar",
    ],
  },
  {
    state: "Telangana", code: "TG",
    districts: [
      "Adilabad", "Bhadradri Kothagudem", "Hanumakonda", "Hyderabad",
      "Jagtial", "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal",
      "Kamareddy", "Karimnagar", "Khammam", "Kumuram Bheem", "Mahabubabad",
      "Mahabubnagar", "Mancherial", "Medak", "Medchal-Malkajgiri", "Mulugu",
      "Nagarkurnool", "Nalgonda", "Narayanpet", "Nirmal", "Nizamabad",
      "Peddapalli", "Rajanna Sircilla", "Rangareddy", "Sangareddy",
      "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal",
      "Yadadri Bhuvanagiri",
    ],
  },
  {
    state: "Tripura", code: "TR",
    districts: [
      "Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala",
      "South Tripura", "Unakoti", "West Tripura",
    ],
  },
  {
    state: "Uttar Pradesh", code: "UP",
    districts: [
      "Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya",
      "Ayodhya", "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur",
      "Banda", "Barabanki", "Bareilly", "Basti", "Bijnor", "Budaun",
      "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah",
      "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar",
      "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur",
      "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj",
      "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Lakhimpur Kheri",
      "Kushinagar", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba",
      "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad",
      "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Prayagraj", "Raebareli",
      "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar", "Bhadohi",
      "Shahjahanpur", "Shamli", "Shravasti", "Siddharthnagar", "Sitapur",
      "Sonbhadra", "Sultanpur", "Unnao", "Varanasi",
    ],
  },
  {
    state: "Uttarakhand", code: "UT",
    districts: [
      "Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun",
      "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh",
      "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi",
    ],
  },
  {
    state: "West Bengal", code: "WB",
    districts: [
      "Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur",
      "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram",
      "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia",
      "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur",
      "Purba Bardhaman", "Purba Medinipur", "Purulia", "South 24 Parganas",
      "Uttar Dinajpur",
    ],
  },
  // ── Union Territories ──────────────────────────────────────
  {
    state: "Andaman and Nicobar Islands", code: "AN",
    districts: ["Nicobars", "North and Middle Andaman", "South Andaman"],
  },
  {
    state: "Chandigarh", code: "CH",
    districts: ["Chandigarh"],
  },
  {
    state: "Dadra & Nagar Haveli and Daman & Diu", code: "DD",
    districts: ["Dadra and Nagar Haveli", "Daman", "Diu"],
  },
  {
    state: "Delhi", code: "DL",
    districts: [
      "Central Delhi", "East Delhi", "New Delhi", "North Delhi",
      "North East Delhi", "North West Delhi", "Shahdara", "South Delhi",
      "South East Delhi", "South West Delhi", "West Delhi",
    ],
  },
  {
    state: "Jammu and Kashmir", code: "JK",
    districts: [
      "Anantnag", "Bandipora", "Baramulla", "Budgam", "Doda", "Ganderbal",
      "Jammu", "Kathua", "Kishtwar", "Kulgam", "Kupwara", "Poonch",
      "Pulwama", "Rajouri", "Ramban", "Reasi", "Samba", "Shopian",
      "Srinagar", "Udhampur",
    ],
  },
  {
    state: "Ladakh", code: "LA",
    districts: ["Kargil", "Leh"],
  },
  {
    state: "Lakshadweep", code: "LD",
    districts: ["Lakshadweep"],
  },
  {
    state: "Puducherry", code: "PY",
    districts: ["Karaikal", "Mahe", "Puducherry", "Yanam"],
  },
];

// ─── District code generator ─────────────────────────────────
// Produces a unique 2-letter uppercase code for each district within its state.
// Strips directional/common prefixes so "East Kameng" → "KM" not "EK",
// then falls back through several strategies until a unique code is found.

const STRIP_PREFIX =
  /^(North|South|East|West|Upper|Lower|Central|New|Old|Sri|Dr\.|Saint|Shri)\s+/i;

function candidatesFor(raw: string): string[] {
  const clean = raw
    .replace(STRIP_PREFIX, "")
    .replace(/[^A-Za-z\s]/g, "")
    .trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const allWords = raw.replace(/[^A-Za-z\s]/g, "").split(/\s+/).filter(Boolean);
  const w0 = words[0] ?? "";
  const w1 = words[1] ?? "";

  const out: string[] = [];
  // Primary: first 2 letters of the main word
  if (w0.length >= 2) out.push(w0.slice(0, 2).toUpperCase());
  // First letters of first two meaningful words
  if (w0 && w1) out.push((w0[0] + w1[0]).toUpperCase());
  // First + 3rd letter
  if (w0.length >= 3) out.push((w0[0] + w0[2]).toUpperCase());
  // First + 4th letter
  if (w0.length >= 4) out.push((w0[0] + w0[3]).toUpperCase());
  // First letters of any two words in the original name
  if (allWords.length >= 2) out.push((allWords[0][0] + allWords[1][0]).toUpperCase());
  // First letter + A–Z sweep
  if (w0) {
    for (let i = 0; i < 26; i++)
      out.push(w0[0].toUpperCase() + String.fromCharCode(65 + i));
  }
  // Full A–Z brute force
  for (let i = 0; i < 26; i++)
    for (let j = 0; j < 26; j++)
      out.push(String.fromCharCode(65 + i) + String.fromCharCode(65 + j));
  return out;
}

// Lazily computed per-state cache: stateName → { districtName → 2-letter code }
const _districtCodeCache = new Map<string, Map<string, string>>();

function buildDistrictCodes(entry: StateDistricts): Map<string, string> {
  const cached = _districtCodeCache.get(entry.state);
  if (cached) return cached;

  const used = new Set<string>();
  const map = new Map<string, string>();

  for (const district of entry.districts) {
    for (const c of candidatesFor(district)) {
      if (c.length === 2 && /^[A-Z]{2}$/.test(c) && !used.has(c)) {
        map.set(district, c);
        used.add(c);
        break;
      }
    }
  }

  _districtCodeCache.set(entry.state, map);
  return map;
}

// ─── Public helpers ──────────────────────────────────────────

export const ALL_STATES = INDIA_LOCATIONS.map((l) => l.state);

export function getDistricts(state: string): string[] {
  return INDIA_LOCATIONS.find((l) => l.state === state)?.districts ?? [];
}

export function getStateCode(state: string): string {
  return INDIA_LOCATIONS.find((l) => l.state === state)?.code ?? "";
}

export function getDistrictCode(state: string, district: string): string {
  const entry = INDIA_LOCATIONS.find((l) => l.state === state);
  if (!entry) return "";
  return buildDistrictCodes(entry).get(district) ?? "";
}

/** Returns combined code e.g. "AP-GN" for Andhra Pradesh – Guntur */
export function getLocationCode(state: string, district: string): string {
  const sc = getStateCode(state);
  const dc = getDistrictCode(state, district);
  if (!sc || !dc) return "";
  return `${sc}-${dc}`;
}
