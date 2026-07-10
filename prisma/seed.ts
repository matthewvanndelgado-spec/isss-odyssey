import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.chatMessage.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.exchangeProgramApplication.deleteMany();
  await prisma.exchangeProgram.deleteMany();
  await prisma.visaDocument.deleteMany();
  await prisma.visaRecord.deleteMany();
  await prisma.staffAvailability.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.inquiryResponse.deleteMany();
  await prisma.inquiry.deleteMany();
  await prisma.orientationContent.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  // Create staff user
  const staff = await prisma.user.create({
    data: {
      email: "staff@ub.edu.ph",
      passwordHash,
      role: "STAFF",
      firstName: "Maria",
      lastName: "Santos",
      nationality: "Filipino",
    },
  });
  console.log("Created staff user:", staff.email);

  // Create students
  const student1 = await prisma.user.create({
    data: {
      email: "kim.minjun@student.ub.edu.ph",
      passwordHash,
      role: "STUDENT",
      firstName: "Minjun",
      lastName: "Kim",
      nationality: "Korean",
      studentId: "2024-KR-001",
    },
  });

  const student2 = await prisma.user.create({
    data: {
      email: "zhang.wei@student.ub.edu.ph",
      passwordHash,
      role: "STUDENT",
      firstName: "Wei",
      lastName: "Zhang",
      nationality: "Chinese",
      studentId: "2024-CN-002",
    },
  });

  const student3 = await prisma.user.create({
    data: {
      email: "dela.cruz.juan@student.ub.edu.ph",
      passwordHash,
      role: "STUDENT",
      firstName: "Juan",
      lastName: "Dela Cruz",
      nationality: "Filipino",
      studentId: "2024-PH-003",
    },
  });
  console.log("Created 3 students");

  // Create announcements
  const announcements = [
    {
      title: "Visa Renewal Deadline Reminder",
      content: "All international students with visas expiring within 60 days must submit renewal applications to the ISSO office. Please prepare your documents early to avoid processing delays. Required: valid passport, enrollment certificate, and financial documents.",
      authorId: staff.id,
    },
    {
      title: "New Student Orientation Schedule - 2nd Semester 2024-2025",
      content: "Welcome new international students! Orientation sessions will be held from January 6-10, 2025 at the UB Main Campus Auditorium. Topics include campus tour, academic policies, cultural integration, and visa compliance. Attendance is mandatory.",
      authorId: staff.id,
    },
    {
      title: "International Cultural Exchange Festival",
      content: "Join us for the Annual International Cultural Exchange Festival on February 14, 2025 at the UB Gymnasium. Share your culture through food, performances, and exhibitions. Registration for booths is now open at the ISSO office.",
      authorId: staff.id,
    },
    {
      title: "Updated ISSO Office Hours",
      content: "Effective January 2025, the ISSO office hours are Monday to Friday, 8:00 AM to 5:00 PM. Walk-in consultations are available from 9:00 AM to 11:30 AM and 1:30 PM to 4:00 PM. For urgent matters outside office hours, contact our emergency hotline.",
      authorId: staff.id,
    },
    {
      title: "Emergency Contact Numbers Updated",
      content: "Please save these updated emergency contacts: ISSO Emergency Hotline: +63 43 723 1446, UB Security: +63 43 723 1234, Batangas City Police: 166, Philippine Red Cross Batangas: +63 43 723 0616. Your safety is our priority.",
      authorId: staff.id,
    },
  ];

  for (const a of announcements) {
    await prisma.announcement.create({ data: a });
  }
  console.log("Created 5 announcements");

  // Create inquiries
  const inquiry1 = await prisma.inquiry.create({
    data: {
      studentId: student1.id,
      category: "VISA",
      subject: "Visa Extension Process",
      description: "My student visa expires next month. What documents do I need to prepare for the extension? I have my current enrollment certificate but not sure about other requirements.",
      status: "RESPONDED",
    },
  });

  await prisma.inquiryResponse.create({
    data: {
      inquiryId: inquiry1.id,
      staffId: staff.id,
      responseText: "For visa extension, you will need: 1) Valid passport, 2) Current enrollment certificate, 3) Official transcript of records, 4) Proof of financial support (bank statement), 5) Completed BI application form. Please visit the ISSO office for the detailed checklist.",
    },
  });

  await prisma.inquiry.create({
    data: {
      studentId: student2.id,
      category: "ACADEMIC",
      subject: "Course Credit Transfer",
      description: "I took similar courses at my home university in Beijing. Is it possible to transfer credits for Mathematics and Physics courses?",
      status: "IN_PROGRESS",
    },
  });

  await prisma.inquiry.create({
    data: {
      studentId: student1.id,
      category: "GENERAL",
      subject: "Student Insurance Coverage",
      description: "Does UB provide health insurance for international students? If not, what insurance plans do you recommend?",
      status: "PENDING",
    },
  });
  console.log("Created inquiries with responses");

  // Create staff availability
  const today = new Date();
  for (let i = 1; i <= 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    await prisma.staffAvailability.create({
      data: {
        staffId: staff.id,
        date,
        timeSlots: JSON.stringify(["09:00", "09:30", "10:00", "10:30", "11:00", "14:00", "14:30", "15:00", "15:30"]),
        isAvailable: true,
      },
    });
  }
  console.log("Created staff availability for next 2 weeks");

  // Create appointments
  const futureDate1 = new Date(today);
  futureDate1.setDate(today.getDate() + 3);
  const futureDate2 = new Date(today);
  futureDate2.setDate(today.getDate() + 5);
  const pastDate = new Date(today);
  pastDate.setDate(today.getDate() - 7);

  await prisma.appointment.create({
    data: {
      studentId: student1.id,
      staffId: staff.id,
      type: "FACE_TO_FACE",
      date: futureDate1,
      timeSlot: "09:00",
      purpose: "Visa extension consultation - need guidance on document preparation",
      status: "CONFIRMED",
    },
  });

  await prisma.appointment.create({
    data: {
      studentId: student2.id,
      staffId: staff.id,
      type: "ONLINE",
      date: futureDate2,
      timeSlot: "14:00",
      purpose: "Credit transfer evaluation meeting",
      status: "PENDING",
      meetingLink: "https://meet.google.com/abc-defg-hij",
    },
  });

  await prisma.appointment.create({
    data: {
      studentId: student3.id,
      staffId: staff.id,
      type: "FACE_TO_FACE",
      date: pastDate,
      timeSlot: "10:00",
      purpose: "Exchange program application review",
      status: "COMPLETED",
    },
  });
  console.log("Created appointments");

  // Create visa records
  const visaExpiry1 = new Date(today);
  visaExpiry1.setMonth(today.getMonth() + 8);

  const visaExpiry2 = new Date(today);
  visaExpiry2.setDate(today.getDate() + 25);

  const visaExpiry3 = new Date(today);
  visaExpiry3.setMonth(today.getMonth() + 4);

  const visa1 = await prisma.visaRecord.create({
    data: {
      studentId: student1.id,
      visaType: "STUDENT_VISA",
      status: "VALID",
      expiryDate: visaExpiry1,
      notes: "9(f) Student Visa - valid for academic year 2024-2025",
    },
  });

  const visa2 = await prisma.visaRecord.create({
    data: {
      studentId: student2.id,
      visaType: "SPECIAL_STUDY_PERMIT",
      status: "EXPIRING_SOON",
      expiryDate: visaExpiry2,
      notes: "SSP expires soon - renewal application needed immediately",
    },
  });

  await prisma.visaRecord.create({
    data: {
      studentId: student3.id,
      visaType: "EXCHANGE_VISA",
      status: "VALID",
      expiryDate: visaExpiry3,
      notes: "Exchange program visa - Mobility Program with Waseda University",
    },
  });

  // Create visa documents
  await prisma.visaDocument.create({
    data: {
      visaRecordId: visa1.id,
      documentType: "Valid Passport",
      fileName: "passport_kim_minjun.pdf",
      fileUrl: "/uploads/passport_kim_minjun.pdf",
      status: "APPROVED",
    },
  });

  await prisma.visaDocument.create({
    data: {
      visaRecordId: visa1.id,
      documentType: "Certificate of Enrollment",
      fileName: "enrollment_cert_2024.pdf",
      fileUrl: "/uploads/enrollment_cert_2024.pdf",
      status: "APPROVED",
    },
  });

  await prisma.visaDocument.create({
    data: {
      visaRecordId: visa2.id,
      documentType: "Valid Passport",
      fileName: "passport_zhang_wei.pdf",
      fileUrl: "/uploads/passport_zhang_wei.pdf",
      status: "APPROVED",
    },
  });

  await prisma.visaDocument.create({
    data: {
      visaRecordId: visa2.id,
      documentType: "Proof of Financial Support",
      fileName: "bank_statement_zhang.pdf",
      fileUrl: "/uploads/bank_statement_zhang.pdf",
      status: "PENDING",
    },
  });
  console.log("Created visa records and documents");

  // Create exchange programs
  const deadline1 = new Date(today);
  deadline1.setMonth(today.getMonth() + 2);
  const deadline2 = new Date(today);
  deadline2.setMonth(today.getMonth() + 3);

  const programs = [
    {
      title: "ASEAN University Network Student Exchange",
      description: "Semester-long academic exchange program with partner universities across Southeast Asia. Students can take courses in their field of study at top ASEAN universities while earning credits transferable to UB.",
      type: "ACADEMIC",
      eligibility: "Minimum GPA of 2.5, completed at least 2 semesters at UB, valid passport, proficiency in English",
      deadline: deadline1,
      applicationUrl: "https://aun-exchange.example.com/apply",
    },
    {
      title: "Japan-Philippines Academic Bridge Program",
      description: "One-year exchange program with partner universities in Japan focusing on Engineering and Computer Science. Includes Japanese language courses, cultural immersion activities, and research opportunities.",
      type: "ACADEMIC",
      eligibility: "Engineering or CS students, GPA 2.75+, JLPT N4 or willingness to complete Japanese language course",
      deadline: deadline2,
      applicationUrl: "https://jp-ph-bridge.example.com",
    },
    {
      title: "Korean Cultural Immersion Program",
      description: "8-week cultural exchange program in Seoul, South Korea. Includes Korean language classes, cultural workshops (K-pop dance, traditional cooking, calligraphy), company visits, and homestay experience.",
      type: "CULTURAL",
      eligibility: "Open to all students, interest in Korean culture, basic English communication skills",
      deadline: deadline1,
    },
    {
      title: "ASEAN Cultural Youth Forum",
      description: "2-week cultural exchange bringing together students from 10 ASEAN nations. Participants share their cultural heritage through performances, food festivals, and collaborative projects promoting regional unity.",
      type: "CULTURAL",
      eligibility: "Active in student organizations, willingness to represent Filipino culture, good academic standing",
      deadline: deadline2,
    },
    {
      title: "Global Mobility Program - Australia",
      description: "Short-term study abroad opportunity at partner universities in Sydney and Melbourne. 4-week intensive program covering academic modules, industry visits, and cultural exploration in Australia.",
      type: "MOBILITY",
      eligibility: "Any undergraduate student, GPA 2.0+, valid passport, English proficiency",
      deadline: deadline1,
      applicationUrl: "https://global-mobility-au.example.com",
    },
    {
      title: "Taiwan Academic Mobility Exchange",
      description: "One-semester mobility program with National Taiwan University of Science and Technology. Focus on technology and innovation with opportunities for laboratory research and startup incubation.",
      type: "MOBILITY",
      eligibility: "STEM students preferred, GPA 2.5+, completed at least 4 semesters",
      deadline: deadline2,
    },
  ];

  for (const p of programs) {
    await prisma.exchangeProgram.create({ data: p });
  }
  console.log("Created 6 exchange programs");

  // Create orientation content
  const orientationContent = [
    // ACADEMIC
    {
      category: "ACADEMIC",
      title: "Enrollment and Registration Process",
      content: "## How to Enroll at UB\n\nWelcome to the University of Batangas! Here is the step-by-step enrollment process for international students:\n\n1. Submit your admission documents to the Registrar's Office\n2. Get your assessment form from the Cashier's Office\n3. Pay the required fees (tuition, miscellaneous, laboratory)\n4. Submit payment receipt to the Registrar\n5. Get your official class schedule\n6. Attend the ISSO orientation for international students\n\n### Important Reminders\n\n- Enrollment is done per semester (August and January)\n- Late enrollment incurs additional fees\n- Maximum course load: 24 units per semester\n- Minimum course load for visa compliance: 18 units",
      order: 0,
    },
    {
      category: "ACADEMIC",
      title: "Grading System and Academic Policies",
      content: "## UB Grading System\n\nThe University of Batangas uses a numerical grading system:\n\n- **1.0** - Excellent (96-100%)\n- **1.25** - Very Good (93-95%)\n- **1.5** - Very Good (90-92%)\n- **1.75** - Good (87-89%)\n- **2.0** - Good (84-86%)\n- **2.25** - Satisfactory (81-83%)\n- **2.5** - Satisfactory (78-80%)\n- **2.75** - Fair (75-77%)\n- **3.0** - Passing (72-74%)\n- **5.0** - Failed (below 72%)\n\n### Academic Standing\n\n- Dean's List: GWA of 1.5 or better\n- Probation: GWA below 2.75\n- International students must maintain GWA of 2.75 or better for visa compliance",
      order: 1,
    },
    {
      category: "ACADEMIC",
      title: "Library and Learning Resources",
      content: "## UB Library Services\n\nThe UB Main Library is located at the 3rd Floor of the Academic Building.\n\n### Services Available\n\n- Book lending (up to 5 books for 3 days)\n- Online database access (EBSCO, ProQuest, JSTOR)\n- Quiet study areas and group discussion rooms\n- Computer workstations with internet access\n- Printing and photocopying services\n- Research assistance from librarians\n\n### Library Hours\n\n- Monday to Friday: 7:00 AM - 7:00 PM\n- Saturday: 8:00 AM - 5:00 PM\n- Sunday: Closed\n\n### Digital Resources\n\nAccess e-books and journals through the UB Digital Library portal using your student credentials.",
      order: 2,
    },

    // CULTURAL
    {
      category: "CULTURAL",
      title: "Filipino Culture and Customs",
      content: "## Understanding Filipino Culture\n\nThe Philippines is known for its warm hospitality and strong family values. Here are key cultural aspects:\n\n### Greetings\n\n- **Mano Po** - Taking the hand of an elder to your forehead as a sign of respect\n- Filipinos often greet with a smile and \"Kamusta?\" (How are you?)\n- Use \"Po\" and \"Opo\" when speaking to elders (signs of respect)\n\n### Social Norms\n\n- Filipinos value close personal relationships\n- Punctuality is flexible in social settings (\"Filipino Time\")\n- Sharing food is a common gesture of friendship\n- \"Bayanihan\" spirit - community helping each other\n\n### Food Culture\n\n- Rice is a staple in every meal\n- Try local favorites: Adobo, Sinigang, Kare-Kare, Lechon\n- In Batangas: Try Lomi, Goto, and Kapeng Barako (Batangas coffee)\n- \"Merienda\" - mid-afternoon snack time (3-4 PM)",
      order: 0,
    },
    {
      category: "CULTURAL",
      title: "Local Transportation in Batangas City",
      content: "## Getting Around Batangas City\n\n### Common Transport Options\n\n- **Jeepney** - Most common public transport. Fare starts at PHP 13. Signal the driver by saying \"Para!\" to stop\n- **Tricycle** - Three-wheeled motorcycle for short distances. Negotiate fare before boarding (PHP 20-50)\n- **Bus** - For travel to Manila and other provinces. Terminal at Batangas City Grand Terminal\n- **Grab/Taxi** - Available via app for convenience\n\n### Getting to UB Campus\n\n- From Batangas Grand Terminal: Take a jeepney to \"Hilltop\" (PHP 15)\n- From Manila: Take a bus to Batangas City (2-3 hours, PHP 180-250)\n\n### Important Tips\n\n- Keep small bills and coins for public transport\n- Avoid rush hours (7-8 AM, 5-6 PM) if possible\n- Download offline maps as a backup\n- Save the UB address in Filipino for drivers: \"University of Batangas, Hilltop, Batangas City\"",
      order: 1,
    },
    {
      category: "CULTURAL",
      title: "Philippine Holidays and Festivals",
      content: "## Important Dates and Celebrations\n\n### National Holidays (No Classes)\n\n- January 1 - New Year's Day\n- April (varies) - Holy Week (Maundy Thursday, Good Friday)\n- April 9 - Araw ng Kagitingan (Day of Valor)\n- May 1 - Labor Day\n- June 12 - Independence Day\n- August (last Monday) - National Heroes Day\n- November 1 - All Saints Day\n- November 30 - Bonifacio Day\n- December 25 - Christmas Day\n- December 30 - Rizal Day\n\n### Batangas City Festivals\n\n- **Sublian Festival** (July) - Batangas cultural dance festival\n- **Parada ng Lechon** (June) - Balayan roasted pig parade\n\n### UB Events\n\n- Foundation Day - September\n- Intramurals - October\n- Christmas Program - December",
      order: 2,
    },

    // SAFETY_EMERGENCY
    {
      category: "SAFETY_EMERGENCY",
      title: "Emergency Contacts and Procedures",
      content: "## Emergency Information\n\n### Emergency Hotlines\n\n- **UB Security Office**: +63 43 723 1234\n- **ISSO Emergency**: +63 43 723 1446\n- **Philippine National Police**: 911 or 166\n- **Bureau of Fire Protection**: 160\n- **Philippine Red Cross**: 143\n- **Batangas Provincial Hospital**: +63 43 723 0616\n\n### On-Campus Emergency Procedures\n\n1. **Fire**: Evacuate immediately using nearest exit. Assembly point: UB Grandstand\n2. **Earthquake**: Duck, Cover, Hold. Evacuate after shaking stops\n3. **Medical Emergency**: Call UB Clinic (+63 43 723 1234 loc 120) or bring patient to clinic at Ground Floor, Admin Building\n4. **Security Threat**: Lock doors, stay quiet, call security\n\n### UB Clinic Hours\n\n- Monday to Friday: 8:00 AM - 5:00 PM\n- School nurse available during class hours\n- Free basic medical consultations for enrolled students",
      order: 0,
    },
    {
      category: "SAFETY_EMERGENCY",
      title: "Natural Disaster Preparedness",
      content: "## Preparing for Natural Disasters\n\nThe Philippines experiences typhoons, earthquakes, and volcanic activity. Being prepared is essential.\n\n### Typhoon Preparedness\n\n- Monitor weather updates via PAGASA (weather.ph)\n- Stock emergency supplies: water, food, flashlight, first aid kit\n- Know your evacuation route from your accommodation\n- Classes are automatically suspended during Signal #2 and above\n- UB will announce suspensions via official social media and SMS\n\n### Earthquake Safety\n\n- Philippines sits on the Pacific Ring of Fire\n- Practice Drop-Cover-Hold during drills\n- Identify safe spots in your room (under sturdy furniture)\n- After shaking: check for injuries, evacuate if building is damaged\n\n### Taal Volcano\n\n- Taal Volcano is located in Batangas province\n- Monitor PHIVOLCS alerts for volcanic activity\n- If alert level rises, follow ISSO and university announcements\n- Keep an emergency go-bag ready (documents, water, medicine)",
      order: 1,
    },
    {
      category: "SAFETY_EMERGENCY",
      title: "Health and Safety Tips",
      content: "## Staying Safe and Healthy\n\n### General Safety\n\n- Always carry your student ID and a photocopy of your passport\n- Avoid walking alone at night in unfamiliar areas\n- Keep emergency numbers saved in your phone\n- Register with your embassy in Manila\n- Inform ISSO if you travel outside Batangas City\n\n### Health Tips\n\n- Drink bottled or filtered water\n- Use mosquito repellent (dengue prevention)\n- Get travel insurance that covers medical emergencies\n- Nearby hospitals: Batangas Medical Center, St. Patrick Hospital\n\n### Important Documents to Keep Safe\n\n- Original passport and visa\n- ACR I-Card (Alien Certificate of Registration)\n- Student permit/enrollment documents\n- Insurance documents\n- Emergency contact information",
      order: 2,
    },

    // STUDENT_LIFE
    {
      category: "STUDENT_LIFE",
      title: "Campus Facilities and Services",
      content: "## UB Campus Facilities\n\n### Academic Facilities\n\n- Computer Laboratories (multiple buildings)\n- Science Laboratories (Chemistry, Physics, Biology)\n- Engineering Workshops\n- Maritime Simulation Center\n- Speech Laboratory\n\n### Student Services\n\n- **Student Affairs Office** - counseling, activities, organizations\n- **Guidance Center** - free counseling services\n- **UB Clinic** - basic medical services\n- **Registrar's Office** - academic records, enrollment\n- **Cashier's Office** - payments, financial concerns\n\n### Recreation\n\n- Gymnasium and sports courts\n- Student lounge areas\n- Canteen and food stalls\n- Wi-Fi available in all buildings (UB-Student network)\n\n### Student Organizations\n\nInternational students are welcome to join any recognized student organization. Contact Student Affairs for the complete list.",
      order: 0,
    },
    {
      category: "STUDENT_LIFE",
      title: "Accommodation and Living Costs",
      content: "## Living in Batangas City\n\n### Accommodation Options\n\n- **Boarding houses** near campus: PHP 2,000-5,000/month\n- **Apartments**: PHP 5,000-15,000/month\n- **Condominiums**: PHP 10,000-25,000/month (in Lipa or nearby)\n\n### Monthly Living Costs (Estimated)\n\n- Accommodation: PHP 3,000-10,000\n- Food: PHP 5,000-8,000\n- Transportation: PHP 1,000-2,000\n- Utilities: PHP 1,000-3,000\n- Miscellaneous: PHP 2,000-3,000\n- **Total**: PHP 12,000-26,000/month (approximately $220-470 USD)\n\n### Tips for Finding Accommodation\n\n- Ask the ISSO office for recommended boarding houses\n- Look for places within walking distance to campus\n- Check if utilities are included in rent\n- Ensure the area is safe and well-lit\n- Consider shared accommodation to reduce costs",
      order: 1,
    },
    {
      category: "STUDENT_LIFE",
      title: "Dining and Food Options",
      content: "## Food Around Campus\n\n### UB Canteen\n\n- Located at the Ground Floor of the Student Center\n- Affordable meals: PHP 50-80 per meal\n- Open Monday-Saturday, 7:00 AM - 6:00 PM\n- Variety of Filipino dishes daily\n\n### Nearby Restaurants\n\n- SM City Batangas food court (10 min by jeepney)\n- Bay City Mall restaurants\n- Local carinderias along Hilltop road (budget-friendly)\n- Korean and Chinese restaurants in the city center\n\n### Grocery Shopping\n\n- SM Supermarket (SM City Batangas)\n- Puregold Batangas\n- Local wet market for fresh produce (cheaper)\n\n### For International Students\n\n- Korean ingredients available at Korean mart in Lipa City\n- Chinese groceries at SM Supermarket international section\n- Halal food options available at select restaurants\n- Ask fellow international students for restaurant recommendations!",
      order: 2,
    },

    // ABOUT_UB_ISSO
    {
      category: "ABOUT_UB_ISSO",
      title: "About University of Batangas",
      content: "## University of Batangas (UB)\n\n### History\n\nFounded in 1946 as Batangas Institute of Technology, the institution has grown to become one of the leading universities in the CALABARZON region. It was granted university status in 2001.\n\n### Vision\n\nA globally competitive university nurturing professional leaders through quality education, research, and community service.\n\n### Academic Programs\n\n- College of Engineering\n- College of Business Administration\n- College of Education\n- College of Arts and Sciences\n- College of Computing Studies\n- College of Maritime Education\n- College of Nursing and Allied Health Sciences\n\n### Accreditation\n\n- PACUCOA accredited programs (Level II and III)\n- ISO 9001:2015 certified\n- CHED recognized university\n\n### Campus Location\n\nHilltop, Batangas City, 4200 Philippines\nApproximately 100 km south of Manila",
      order: 0,
    },
    {
      category: "ABOUT_UB_ISSO",
      title: "ISSO Services and Staff",
      content: "## International Student Services Office (ISSO)\n\n### Our Mission\n\nTo provide comprehensive support services for international students, ensuring a smooth academic and cultural transition at the University of Batangas.\n\n### Services We Offer\n\n- Visa application and renewal assistance\n- Academic advising for international students\n- Cultural orientation and integration programs\n- Emergency support and referrals\n- Document certification and verification\n- Airport pickup for new students (upon request)\n- Housing assistance and referrals\n- Language support services\n\n### Office Information\n\n- **Location**: Main Campus, 2nd Floor, Admin Building\n- **Hours**: Monday-Friday, 8:00 AM - 5:00 PM\n- **Email**: isso@ub.edu.ph\n- **Phone**: +63 43 723 1446\n- **Emergency**: +63 917 123 4567\n\n### Staff\n\n- Office Head: Ms. Maria Santos\n- Student Coordinator: Mr. Roberto Cruz\n- Visa Specialist: Ms. Angela Reyes",
      order: 1,
    },
    {
      category: "ABOUT_UB_ISSO",
      title: "Visa Requirements and Compliance",
      content: "## Visa Information for International Students\n\n### Types of Student Visas\n\n- **9(f) Student Visa** - For degree-seeking students (valid for 1 year, renewable)\n- **Special Study Permit (SSP)** - For short-term study programs (6 months)\n- **47(a)(2) Visa** - For exchange/visiting students\n\n### Maintaining Visa Status\n\nTo remain in good standing, you must:\n\n1. Maintain full-time enrollment (minimum 18 units)\n2. Maintain GWA of 2.75 or better\n3. Report to ISSO every semester for compliance check\n4. Not engage in unauthorized employment\n5. Notify ISSO of any address changes\n6. Renew visa before expiry date\n\n### Renewal Process\n\n1. Submit application to ISSO (at least 30 days before expiry)\n2. Prepare required documents (see checklist)\n3. ISSO forwards to Bureau of Immigration\n4. Processing time: 2-4 weeks\n5. Pick up renewed visa at ISSO\n\n### Penalties for Non-Compliance\n\n- Overstaying: PHP 500/month fine\n- Working without permit: Deportation risk\n- Failure to report: Warning, then possible visa cancellation",
      order: 2,
    },
  ];

  for (const oc of orientationContent) {
    await prisma.orientationContent.create({ data: oc });
  }
  console.log("Created orientation content (15 items, 3 per category)");

  // Create notifications
  const notifications = [
    {
      userId: student1.id,
      type: "VISA",
      title: "Visa Extension Reminder",
      message: "Your visa expires in 30 days. Please visit the ISSO office to begin the renewal process.",
      link: "/visa",
    },
    {
      userId: student1.id,
      type: "APPOINTMENT",
      title: "Appointment Confirmed",
      message: "Your appointment with Ms. Santos on the visa extension consultation has been confirmed.",
      link: "/appointments",
      isRead: true,
    },
    {
      userId: student2.id,
      type: "VISA",
      title: "Urgent: Visa Expiring Soon",
      message: "Your Special Study Permit expires in less than 30 days. Immediate action required.",
      link: "/visa",
    },
    {
      userId: student2.id,
      type: "INQUIRY",
      title: "Inquiry Update",
      message: "Your inquiry about credit transfer has been assigned to a staff member.",
      link: "/inquiries",
    },
    {
      userId: student3.id,
      type: "ANNOUNCEMENT",
      title: "New Announcement",
      message: "International Cultural Exchange Festival registration is now open!",
      link: "/dashboard",
      isRead: true,
    },
  ];

  for (const n of notifications) {
    await prisma.notification.create({ data: n });
  }
  console.log("Created notifications");

  // Create sample chat messages
  await prisma.chatMessage.create({
    data: {
      studentId: student1.id,
      role: "USER",
      content: "How do I renew my student visa?",
      language: "en",
    },
  });

  await prisma.chatMessage.create({
    data: {
      studentId: student1.id,
      role: "ASSISTANT",
      content: "To renew your student visa at UB, follow these steps:\n\n1. Visit the ISSO office at least 30 days before your visa expiry\n2. Prepare the following documents:\n   - Valid passport\n   - Current enrollment certificate\n   - Official transcript of records\n   - Proof of financial support\n   - Completed BI application form\n3. Submit your documents to the ISSO staff\n4. Pay the renewal fee at the Cashier's Office\n5. ISSO will process your application with the Bureau of Immigration\n\nProcessing usually takes 2-4 weeks. Would you like more details about any specific requirement?",
      language: "en",
    },
  });

  await prisma.chatMessage.create({
    data: {
      studentId: student2.id,
      role: "USER",
      content: "UB的校园在哪里？",
      language: "zh",
    },
  });

  await prisma.chatMessage.create({
    data: {
      studentId: student2.id,
      role: "ASSISTANT",
      content: "University of Batangas (UB) 主校区位于：\n\n📍 地址：Hilltop, Batangas City, 4200 Philippines\n\n校园位于八打雁市的山顶区域，距离马尼拉大约100公里（约2-3小时车程）。\n\n如何到达：\n- 从马尼拉：乘坐巴士到八打雁市总站（Batangas Grand Terminal），然后搭乘吉普尼到\"Hilltop\"\n- 从校外住宿：大多数学生步行或搭乘三轮车到校\n\nISSO办公室在行政大楼二楼。如有需要，可以联系我们：+63 43 723 1446",
      language: "zh",
    },
  });

  await prisma.chatMessage.create({
    data: {
      studentId: student1.id,
      role: "USER",
      content: "한국 학생 모임이 있나요?",
      language: "ko",
    },
  });

  await prisma.chatMessage.create({
    data: {
      studentId: student1.id,
      role: "ASSISTANT",
      content: "네, UB에는 유학생 모임이 있습니다!\n\n🇰🇷 한국 학생 관련 정보:\n\n1. **유학생 회** - 모든 유학생이 참여할 수 있는 공식 학생 단체입니다\n2. **한국 학생 친목회** - 비공식적인 한국 학생 모임\n3. **문화 교류 행사** - ISSO에서 정기적으로 개최하는 문화 행사\n\n참여 방법:\n- Student Affairs Office에 문의하시거나\n- ISSO 사무실을 방문해주세요 (행정동 2층)\n\n한국 음식점도 근처에 있어요:\n- Lipa City에 한국 식료품점이 있습니다\n- SM City Batangas에도 한식 옵션이 있어요\n\n더 궁금한 점이 있으시면 언제든 물어보세요!",
      language: "ko",
    },
  });
  console.log("Created chat messages");

  console.log("\n✅ Database seeded successfully!");
  console.log("\nDemo Accounts:");
  console.log("  Staff: staff@ub.edu.ph / password123");
  console.log("  Student 1 (Korean): kim.minjun@student.ub.edu.ph / password123");
  console.log("  Student 2 (Chinese): zhang.wei@student.ub.edu.ph / password123");
  console.log("  Student 3 (Filipino): dela.cruz.juan@student.ub.edu.ph / password123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
