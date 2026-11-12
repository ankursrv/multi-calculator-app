/**
 * Dynamic Clinical Medicine Resolution Engine.
 * Formats every medicine strictly in the clean, user-requested bilingual structure:
 * - Intro summary sentence (e.g., "Ajubi Tablet is a combination of Aspirin, Caffeine and Paracetamol.")
 * - मुख्य उपयोग (Uses) with labeled bullet points + Tata 1mg reference link
 * - सामान्य दुष्प्रभाव (Side Effects)
 * - सावधानी और चेतावनी (Precautions & Warnings: Pregnancy, Organ Disease, Alcohol, Doctor's Advice)
 *
 * Zero API key required. Always preserves the exact medicine name searched by the user.
 */

const BRAND_TO_CLINICAL = [
  // 0. Ajubi Tablet (Exact user example: Aspirin + Caffeine + Paracetamol)
  {
    triggers: ['ajubi', 'ajubi tablet', 'अजुबी', 'अजुबी टैबलेट'],
    salt_en: 'Aspirin, Caffeine, and Paracetamol',
    salt_hi: 'एस्पिरिन, कैफीन और पेरासिटामोल',
    isCombination: true,
    oneMgUrl: 'https://www.1mg.com/hi/drugs/ajubi-tablet-719970',
    uses_hi: [
      {
        label: 'दर्द से राहत',
        desc: 'सिरदर्द, दांत दर्द, मांसपेशियों में दर्द, पीठ दर्द, कान और गले का दर्द।',
      },
      {
        label: 'सूजन और जोड़ों का दर्द',
        desc: 'रूमेटॉइड आर्थराइटिस, ऑस्टियोआर्थराइटिस और एंकीलोसिंग स्पॉन्डिलाइटिस जैसी स्थितियों में।',
      },
      {
        label: 'बुखार और सर्दी-जुकाम',
        desc: 'बुखार, बदन दर्द और सर्दी के लक्षणों में आराम के लिए।',
      },
    ],
    uses_en: [
      {
        label: 'Pain Relief',
        desc: 'Headache, toothache, muscle pain, back pain, earache, and throat pain.',
      },
      {
        label: 'Inflammation & Joint Pain',
        desc: 'Conditions such as rheumatoid arthritis, osteoarthritis, and ankylosing spondylitis.',
      },
      {
        label: 'Fever & Cold Symptoms',
        desc: 'Provides relief from fever, body aches, and common cold symptoms.',
      },
    ],
    sideEffects_hi: [
      'हृदय गति बढ़ना',
      'बेचैनी या घबराहट',
      'मिचली या उल्टी',
      'अपच, सीने में जलन या पेट दर्द',
    ],
    sideEffects_en: [
      'Increased heart rate',
      'Restlessness or nervousness',
      'Nausea or vomiting',
      'Indigestion, heartburn, or stomach pain',
    ],
    warnings_hi: [
      {
        label: 'गर्भावस्था और स्तनपान',
        desc: 'गर्भावस्था और स्तनपान के दौरान इस टैबलेट का सेवन असुरक्षित माना जाता है।',
      },
      {
        label: 'अंगों से जुड़ी बीमारी',
        desc: 'किडनी या लिवर की बीमारी से पीड़ित लोगों को इसे लेने से बचना चाहिए।',
      },
      {
        label: 'शराब',
        desc: 'शराब का सेवन करने वाले लोगों के लिए यह असुरक्षित है।',
      },
      {
        label: 'डॉक्टर की सलाह',
        desc: 'इसे लेने से पहले डॉक्टर या किसी नजदीकी स्वास्थ्य विशेषज्ञ से परामर्श अवश्य लें।',
      },
    ],
    warnings_en: [
      {
        label: 'Pregnancy & Breastfeeding',
        desc: 'Consuming this tablet during pregnancy and breastfeeding is considered unsafe.',
      },
      {
        label: 'Organ Disease',
        desc: 'People suffering from kidney or liver disease should avoid taking this medicine.',
      },
      {
        label: 'Alcohol',
        desc: 'It is unsafe for people who consume alcohol.',
      },
      {
        label: "Doctor's Advice",
        desc: 'Always consult a doctor or a nearby healthcare specialist before taking it.',
      },
    ],
  },

  // 1. Febuxostat / Buxo-40
  {
    triggers: ['buxo', 'febuxostat', 'feburic', 'febutaz', 'febuget', 'zurig', 'febuxor', 'बुक्सो'],
    salt_en: 'Febuxostat (40mg / 80mg)',
    salt_hi: 'फेबुक्सोस्टैट (Febuxostat 40mg / 80mg)',
    isCombination: false,
    uses_hi: [
      {
        label: 'यूरिक एसिड कम करना',
        desc: 'खून में बढ़े हुए यूरिक एसिड (Hyperuricemia) के स्तर को नियंत्रित और कम करने के लिए।',
      },
      {
        label: 'गठिया (गाउट) से बचाव',
        desc: 'जोड़ों (विशेषकर पैर के अंगूठे) में होने वाले तेज दर्द, लालिमा और सूजन के दौरों को रोकने के लिए।',
      },
      {
        label: 'पथरी से सुरक्षा',
        desc: 'जोड़ों और गुर्दे (किडनी) में यूरिक एसिड के क्रिस्टल जमा होने से बचाने में सहायक।',
      },
    ],
    uses_en: [
      {
        label: 'Lowering Uric Acid',
        desc: 'Used for long-term management and reduction of high uric acid levels (hyperuricemia) in blood.',
      },
      {
        label: 'Gout Flare Prevention',
        desc: 'Prevents painful gout attacks, redness, and swelling in joints (especially big toe).',
      },
      {
        label: 'Kidney & Joint Protection',
        desc: 'Prevents urate crystal deposits in joints and urinary stones.',
      },
    ],
    sideEffects_hi: [
      'सिरदर्द या चक्कर आना',
      'हल्की मतली या दस्त',
      'शुरुआती हफ्तों में जोड़ों में हल्का दर्द',
      'लिवर एंजाइम में बदलाव या त्वचा पर चकत्ते',
    ],
    sideEffects_en: [
      'Headache or dizziness',
      'Mild nausea or diarrhea',
      'Temporary joint pain during initial weeks',
      'Elevated liver enzymes or skin rash',
    ],
    warnings_hi: [
      {
        label: 'गर्भावस्था और स्तनपान',
        desc: 'गर्भावस्था और स्तनपान के दौरान इसे लेने से पहले विशेषज्ञ डॉक्टर की सलाह अनिवार्य है।',
      },
      {
        label: 'अंगों से जुड़ी बीमारी',
        desc: 'हृदय रोग, गंभीर किडनी या लिवर की बीमारी वाले मरीजों को डॉक्टर की निगरानी में ही लेना चाहिए।',
      },
      {
        label: 'शराब',
        desc: 'शराब (विशेषकर बीयर) यूरिक एसिड को तेजी से बढ़ाती है, इसलिए इसके साथ शराब न पिएं।',
      },
      {
        label: 'डॉक्टर की सलाह',
        desc: 'गाउट के अचानक तेज दर्द के समय बिना डॉक्टर के शुरू न करें और दिनभर में पर्याप्त पानी पिएं।',
      },
    ],
    warnings_en: [
      {
        label: 'Pregnancy & Breastfeeding',
        desc: 'Doctor consultation is mandatory before using during pregnancy or breastfeeding.',
      },
      {
        label: 'Organ Disease',
        desc: 'Patients with heart, severe kidney, or liver disease should take it strictly under medical supervision.',
      },
      {
        label: 'Alcohol',
        desc: 'Avoid alcohol (especially beer) as it spikes uric acid and reduces medicine effectiveness.',
      },
      {
        label: "Doctor's Advice",
        desc: 'Do not start during an acute gout flare without consulting a doctor; drink plenty of water daily.',
      },
    ],
  },

  // 2. Paracetamol (Dolo 650, Crocin, Calpol, Paracip, Pacimol)
  {
    triggers: ['dolo', 'crocin', 'calpol', 'paracip', 'pacimol', 'paracetamol', 'acetaminophen', 'sumo l', 'p 650', 'डोलो', 'क्रोसीन', 'पैरासिटामोल'],
    salt_en: 'Paracetamol (Acetaminophen)',
    salt_hi: 'पेरासिटामोल (Paracetamol)',
    isCombination: false,
    uses_hi: [
      {
        label: 'बुखार से राहत',
        desc: 'वायरल, फ्लू, डेंगू, मलेरिया या सामान्य संक्रमण के कारण आने वाले तेज़ बुखार को कम करने के लिए।',
      },
      {
        label: 'दर्द निवारक',
        desc: 'सिरदर्द, माइग्रेन, दांत दर्द, कमर दर्द, मांसपेशियों और शरीर के हल्के से मध्यम दर्द में आराम।',
      },
      {
        label: 'टीकाकरण के बाद',
        desc: 'वैक्सीनेशन के बाद होने वाले बुखार और बदन दर्द में सुरक्षित रूप से उपयोग की जाती है।',
      },
    ],
    uses_en: [
      {
        label: 'Fever Reduction',
        desc: 'Reduces high fever caused by viral flu, dengue, or general infections.',
      },
      {
        label: 'Pain Relief',
        desc: 'Relieves mild to moderate pain including headache, toothache, back pain, and muscle ache.',
      },
      {
        label: 'Post-Vaccination',
        desc: 'Commonly used to ease fever and soreness after vaccination.',
      },
    ],
    sideEffects_hi: [
      'खाली पेट लेने पर हल्की मतली या पेट खराब होना',
      'बुखार उतरते समय अधिक पसीना आना',
      'बहुत अधिक खुराक (ओवरडोज़) लेने पर लिवर को नुकसान',
      'दुर्लभ मामलों में त्वचा पर लाल दाने या एलर्जी',
    ],
    sideEffects_en: [
      'Mild nausea or upset stomach if taken empty stomach',
      'Sweating as fever breaks',
      'Liver damage in case of overdose (>4000mg/day)',
      'Rare allergic skin rash',
    ],
    warnings_hi: [
      {
        label: 'गर्भावस्था और स्तनपान',
        desc: 'गर्भावस्था और स्तनपान के दौरान डॉक्टर की सलाह से इसे आमतौर पर सुरक्षित माना जाता है।',
      },
      {
        label: 'अंगों से जुड़ी बीमारी',
        desc: 'लिवर या किडनी की गंभीर बीमारी से पीड़ित लोगों को डॉक्टर से पूछकर कम खुराक लेनी चाहिए।',
      },
      {
        label: 'शराब',
        desc: 'शराब के साथ इसका सेवन असुरक्षित है क्योंकि इससे लिवर खराब होने का खतरा कई गुना बढ़ जाता है।',
      },
      {
        label: 'डॉक्टर की सलाह',
        desc: 'दो खुराकों के बीच 4-6 घंटे का अंतर रखें और 3 दिन से अधिक बुखार रहने पर डॉक्टर से मिलें।',
      },
    ],
    warnings_en: [
      {
        label: 'Pregnancy & Breastfeeding',
        desc: 'Generally considered safe during pregnancy and breastfeeding when advised by a doctor.',
      },
      {
        label: 'Organ Disease',
        desc: 'People with severe liver or kidney disease must consult a doctor for dose adjustment.',
      },
      {
        label: 'Alcohol',
        desc: 'Unsafe with alcohol as it significantly increases the risk of liver toxicity.',
      },
      {
        label: "Doctor's Advice",
        desc: 'Maintain a 4-6 hour gap between doses; consult a doctor if fever lasts over 3 days.',
      },
    ],
  },

  // 3. Combiflam / Flexon / Ibugesic Plus
  {
    triggers: ['combiflam', 'flexon', 'ibugesic', 'brufen plus', 'कॉम्बिफ्लाम', 'फ्लेक्सॉन'],
    salt_en: 'Ibuprofen and Paracetamol',
    salt_hi: 'इबुप्रोफेन और पेरासिटामोल',
    isCombination: true,
    uses_hi: [
      {
        label: 'तेज दर्द से राहत',
        desc: 'सिरदर्द, माइग्रेन, दांत व दाढ़ दर्द, कान दर्द और मांसपेशियों के दर्द में तुरंत आराम।',
      },
      {
        label: 'सूजन और जोड़ों का दर्द',
        desc: 'मोच, चोट की सूजन, गठिया और कमर के दर्द को कम करने के लिए।',
      },
      {
        label: 'बुखार व मासिक धर्म दर्द',
        desc: 'बदन दर्द के साथ आने वाले बुखार और पीरियड्स के दर्द में राहत के लिए।',
      },
    ],
    uses_en: [
      {
        label: 'Acute Pain Relief',
        desc: 'Fast relief from headache, toothache, dental pain, earache, and body ache.',
      },
      {
        label: 'Swelling & Joint Pain',
        desc: 'Reduces muscle sprains, joint inflammation, arthritis, and back pain.',
      },
      {
        label: 'Fever & Period Cramps',
        desc: 'Lowers inflammatory fever and relieves menstrual cramps.',
      },
    ],
    sideEffects_hi: [
      'पेट में जलन, एसिडिटी या सीने में जलन',
      'जी मिचलाना या उल्टी',
      'पेट में मरोड़ या अपच',
      'लंबे समय तक लेने पर पेट में अल्सर का खतरा',
    ],
    sideEffects_en: [
      'Acidity, heartburn, or stomach burning',
      'Nausea or vomiting',
      'Stomach cramps or indigestion',
      'Risk of gastric ulcers with prolonged use',
    ],
    warnings_hi: [
      {
        label: 'गर्भावस्था और स्तनपान',
        desc: 'गर्भावस्था (विशेषकर तीसरी तिमाही) में इसका सेवन असुरक्षित माना जाता है।',
      },
      {
        label: 'अंगों से जुड़ी बीमारी',
        desc: 'किडनी, लिवर, पेट के अल्सर या अस्थमा के मरीजों को इसे लेने से बचना चाहिए।',
      },
      {
        label: 'शराब',
        desc: 'शराब के साथ इसका सेवन असुरक्षित है; इससे पेट में ब्लीडिंग का खतरा बढ़ता है।',
      },
      {
        label: 'डॉक्टर की सलाह',
        desc: 'हमेशा भरपेट भोजन या दूध के बाद ही लें, खाली पेट कभी न लें और डॉक्टर से सलाह लें।',
      },
    ],
    warnings_en: [
      {
        label: 'Pregnancy & Breastfeeding',
        desc: 'Considered unsafe during pregnancy (especially in the third trimester).',
      },
      {
        label: 'Organ Disease',
        desc: 'Avoid if you have kidney disease, liver disease, stomach ulcers, or asthma.',
      },
      {
        label: 'Alcohol',
        desc: 'Unsafe with alcohol as it increases the risk of stomach bleeding.',
      },
      {
        label: "Doctor's Advice",
        desc: 'Always take after a meal or milk, never on an empty stomach; consult a doctor before use.',
      },
    ],
  },

  // 4. Saridon / Dart
  {
    triggers: ['saridon', 'dart', 'सैरिडॉन', 'सेरिडोन'],
    salt_en: 'Paracetamol, Propyphenazone, and Caffeine',
    salt_hi: 'पेरासिटामोल, प्रोपीफेनाज़ोन और कैफीन',
    isCombination: true,
    uses_hi: [
      {
        label: 'तेज सिरदर्द व माइग्रेन',
        desc: 'तनाव से होने वाले गंभीर सिरदर्द और माइग्रेन में 15 से 30 मिनट में तेज राहत।',
      },
      {
        label: 'दांत व बदन दर्द',
        desc: 'दांत दर्द, साइनस के कारण सिर भारी होना और बदन की अकड़न दूर करने के लिए।',
      },
    ],
    uses_en: [
      {
        label: 'Fast Headache & Migraine Relief',
        desc: 'Quickly relieves severe tension headaches and migraine pain.',
      },
      {
        label: 'Toothache & Body Pain',
        desc: 'Relieves dental pain, sinus pressure, and general body aches.',
      },
    ],
    sideEffects_hi: [
      'दिल की धड़कन तेज होना',
      'बेचैनी, घबराहट या नींद न आना',
      'पेट में हल्की जलन या मतली',
    ],
    sideEffects_en: [
      'Increased heart rate',
      'Restlessness, nervousness, or sleeplessness',
      'Mild stomach irritation or nausea',
    ],
    warnings_hi: [
      {
        label: 'गर्भावस्था और स्तनपान',
        desc: 'गर्भावस्था और स्तनपान के दौरान इसे बिना डॉक्टर की सलाह के लेना असुरक्षित है।',
      },
      {
        label: 'अंगों से जुड़ी बीमारी',
        desc: 'लिवर, किडनी या उच्च रक्तचाप (High BP) के मरीजों को सावधानी बरतनी चाहिए।',
      },
      {
        label: 'शराब',
        desc: 'शराब के साथ इसका सेवन असुरक्षित माना जाता है।',
      },
      {
        label: 'डॉक्टर की सलाह',
        desc: 'दिन में 1-2 गोली से अधिक न लें और नियमित दर्द रहने पर डॉक्टर से संपर्क करें।',
      },
    ],
    warnings_en: [
      {
        label: 'Pregnancy & Breastfeeding',
        desc: 'Unsafe to take during pregnancy and breastfeeding without doctor guidance.',
      },
      {
        label: 'Organ Disease',
        desc: 'Patients with liver, kidney, or high BP issues should exercise caution.',
      },
      {
        label: 'Alcohol',
        desc: 'Consuming alcohol with this tablet is unsafe.',
      },
      {
        label: "Doctor's Advice",
        desc: 'Do not exceed 1-2 tablets per day; consult a physician for frequent headaches.',
      },
    ],
  },

  // 5. Pan-D / Pantocid-D
  {
    triggers: ['pan d', 'pand', 'pantocid d', 'pantop d', 'dompan', 'पैन डी', 'पेंटोसिड डी'],
    salt_en: 'Pantoprazole and Domperidone',
    salt_hi: 'पेंटाप्रोजोल और डोम्पेरिडोन',
    isCombination: true,
    uses_hi: [
      {
        label: 'गैस और एसिडिटी (GERD)',
        desc: 'सीने में जलन, खट्टी डकारें, पेट फूलना और गले में खट्टा पानी आने की समस्या से राहत।',
      },
      {
        label: 'मतली और उल्टी रोकना',
        desc: 'एसिडिटी के कारण होने वाले जी मिचलाने, सिरदर्द और उल्टी को नियंत्रित करने के लिए।',
      },
      {
        label: 'पेट के छाले (अल्सर)',
        desc: 'पेप्टिक अल्सर और अन्य दवाओं से होने वाली पेट की जलन से बचाव में।',
      },
    ],
    uses_en: [
      {
        label: 'Acidity & GERD Relief',
        desc: 'Treats acid reflux, heartburn, sour belching, and bloating.',
      },
      {
        label: 'Nausea & Vomiting Control',
        desc: 'Prevents nausea, retching, and indigestion-related discomfort.',
      },
      {
        label: 'Ulcer Healing',
        desc: 'Protects stomach lining from ulcers and painkiller-induced irritation.',
      },
    ],
    sideEffects_hi: [
      'मुंह सूखना',
      'सिरदर्द या हल्का चक्कर आना',
      'दस्त या पेट में हल्का दर्द',
      'लंबे समय तक उपयोग करने पर कमजोरी या हड्डियों में कैल्शियम की कमी',
    ],
    sideEffects_en: [
      'Dry mouth',
      'Mild headache or dizziness',
      'Diarrhea or mild stomach cramps',
      'Calcium/Vitamin B12 deficiency with multi-year continuous use',
    ],
    warnings_hi: [
      {
        label: 'गर्भावस्था और स्तनपान',
        desc: 'गर्भावस्था और स्तनपान के दौरान डॉक्टर की सलाह से ही इसका उपयोग करें।',
      },
      {
        label: 'अंगों से जुड़ी बीमारी',
        desc: 'लिवर की गंभीर बीमारी या हृदय गति की समस्या वाले मरीजों को डॉक्टर को बताना चाहिए।',
      },
      {
        label: 'शराब',
        desc: 'शराब पेट में एसिड को बहुत बढ़ाती है, इसलिए दवा के दौरान शराब न पिएं।',
      },
      {
        label: 'डॉक्टर की सलाह',
        desc: 'इसे सुबह खाली पेट (नाश्ते से 30-45 मिनट पहले) पूरा निगलें, चबाएं नहीं।',
      },
    ],
    warnings_en: [
      {
        label: 'Pregnancy & Breastfeeding',
        desc: 'Consult your doctor before taking during pregnancy or breastfeeding.',
      },
      {
        label: 'Organ Disease',
        desc: 'Inform your doctor if you have severe liver issues or cardiac rhythm disorders.',
      },
      {
        label: 'Alcohol',
        desc: 'Avoid alcohol as it worsens gastric acid secretion.',
      },
      {
        label: "Doctor's Advice",
        desc: 'Swallow whole in the morning on an empty stomach (30-45 mins before breakfast).',
      },
    ],
  },

  // 6. Pan 40 / Pantocid 40 / Pantoprazole
  {
    triggers: ['pan 40', 'pan40', 'pantocid 40', 'pantop 40', 'pantoprazole', 'पैन 40'],
    salt_en: 'Pantoprazole (40mg)',
    salt_hi: 'पेंटाप्रोजोल (Pantoprazole 40mg)',
    isCombination: false,
    uses_hi: [
      {
        label: 'एसिडिटी व तेजाब कम करना',
        desc: 'पेट में बनने वाले अतिरिक्त एसिड को रोककर सीने की जलन और खट्टी डकार से राहत।',
      },
      {
        label: 'पेट के अल्सर का इलाज',
        desc: 'पेट और आंतों के छालों (पेप्टिक अल्सर) को भरने और ठीक करने के लिए।',
      },
    ],
    uses_en: [
      {
        label: 'Acid Suppression',
        desc: 'Reduces excess stomach acid to relieve heartburn and acid reflux.',
      },
      {
        label: 'Peptic Ulcer Treatment',
        desc: 'Heals stomach and intestinal ulcers caused by excess acid.',
      },
    ],
    sideEffects_hi: [
      'सिरदर्द',
      'पेट में गैस या हल्का दस्त',
      'चक्कर आना',
      'लंबे समय तक उपयोग से विटामिन B12 की कमी',
    ],
    sideEffects_en: [
      'Headache',
      'Flatulence or mild diarrhea',
      'Dizziness',
      'Vitamin B12 deficiency on multi-year daily use',
    ],
    warnings_hi: [
      {
        label: 'गर्भावस्था और स्तनपान',
        desc: 'गर्भावस्था और स्तनपान में डॉक्टर की सलाह अनुसार ही उपयोग करें।',
      },
      {
        label: 'अंगों से जुड़ी बीमारी',
        desc: 'लिवर की बीमारी होने पर डॉक्टर से खुराक की पुष्टि अवश्य करें।',
      },
      {
        label: 'शराब',
        desc: 'शराब के साथ इसका सेवन असुरक्षित है क्योंकि यह एसिडिटी बढ़ाती है।',
      },
      {
        label: 'डॉक्टर की सलाह',
        desc: 'सुबह खाली पेट नाश्ते से 30 मिनट पहले पानी के साथ लें।',
      },
    ],
    warnings_en: [
      {
        label: 'Pregnancy & Breastfeeding',
        desc: 'Use only under doctor recommendation during pregnancy and breastfeeding.',
      },
      {
        label: 'Organ Disease',
        desc: 'Consult a physician if you have severe liver disease.',
      },
      {
        label: 'Alcohol',
        desc: 'Avoid alcohol as it counteracts acidity treatment.',
      },
      {
        label: "Doctor's Advice",
        desc: 'Take once daily in the morning 30 minutes before breakfast.',
      },
    ],
  },

  // 7. Azithral 500 / Azithromycin
  {
    triggers: ['azithral', 'azee', 'azimax', 'azithromycin', 'एजिथ्रल', 'एजी'],
    salt_en: 'Azithromycin (500mg / 250mg)',
    salt_hi: 'एज़िथ्रोमाइसिन (Azithromycin)',
    isCombination: false,
    uses_hi: [
      {
        label: 'गले और श्वसन संक्रमण',
        desc: 'टॉन्सिल, गले की खराश, ब्रोंकाइटिस, साइनस और निमोनिया जैसे बैक्टीरियल इन्फेक्शन में।',
      },
      {
        label: 'कान और त्वचा संक्रमण',
        desc: 'कान के संक्रमण, फोड़े-फुंसी और टाइफाइड बुखार के इलाज के लिए।',
      },
    ],
    uses_en: [
      {
        label: 'Throat & Respiratory Infections',
        desc: 'Treats tonsillitis, pharyngitis, bronchitis, sinusitis, and pneumonia.',
      },
      {
        label: 'Ear, Skin & Typhoid',
        desc: 'Effective against ear infections, bacterial skin infections, and typhoid.',
      },
    ],
    sideEffects_hi: [
      'पेट में मरोड़ या दर्द',
      'पतले दस्त (Diarrhea)',
      'जी मिचलाना या उल्टी',
      'मुंह में कड़वा स्वाद',
    ],
    sideEffects_en: [
      'Abdominal cramps or pain',
      'Diarrhea / loose stools',
      'Nausea or vomiting',
      'Metallic or bitter taste',
    ],
    warnings_hi: [
      {
        label: 'गर्भावस्था और स्तनपान',
        desc: 'केवल स्पष्ट चिकित्सीय आवश्यकता होने पर डॉक्टर की सलाह से लें।',
      },
      {
        label: 'अंगों से जुड़ी बीमारी',
        desc: 'लिवर की बीमारी या दिल की धड़कन अनियमित होने पर सावधानी बरतें।',
      },
      {
        label: 'शराब',
        desc: 'एंटीबायोटिक कोर्स के दौरान शराब से बचना चाहिए क्योंकि इससे पेट खराब हो सकता है।',
      },
      {
        label: 'डॉक्टर की सलाह',
        desc: 'यह एक एंटीबायोटिक है—डॉक्टर द्वारा बताया गया 3 या 5 दिन का पूरा कोर्स खत्म करें।',
      },
    ],
    warnings_en: [
      {
        label: 'Pregnancy & Breastfeeding',
        desc: 'Take only when clearly prescribed by a doctor.',
      },
      {
        label: 'Organ Disease',
        desc: 'Use with caution in severe liver disease or heart rhythm issues.',
      },
      {
        label: 'Alcohol',
        desc: 'Avoid alcohol during antibiotic therapy as it increases stomach irritation.',
      },
      {
        label: "Doctor's Advice",
        desc: 'Complete the full prescribed 3-day or 5-day course; do not stop early.',
      },
    ],
  },

  // 8. Augmentin 625 Duo
  {
    triggers: ['augmentin', 'clavam', 'moxikind', 'amoxicillin', 'clavulanic', 'ऑगमेंटिन', 'क्लैवम'],
    salt_en: 'Amoxicillin and Clavulanic Acid',
    salt_hi: 'एमोक्सिसिलिन और क्लैवुलैनिक एसिड',
    isCombination: true,
    uses_hi: [
      {
        label: 'बैक्टीरियल संक्रमण',
        desc: 'फेफड़ों, गले, कान, नाक और साइनस के गंभीर बैक्टीरियल इन्फेक्शन को ठीक करने के लिए।',
      },
      {
        label: 'दांत और यूरिन इन्फेक्शन',
        desc: 'दांतों के मवाद, त्वचा के घाव और यूरिनरी ट्रैक्ट इन्फेक्शन (UTI) के इलाज में।',
      },
    ],
    uses_en: [
      {
        label: 'Respiratory & ENT Infections',
        desc: 'Treats bacterial infections of lungs, throat, ears, nose, and sinuses.',
      },
      {
        label: 'Dental, Skin & UTI',
        desc: 'Used for dental abscesses, soft tissue infections, and urinary tract infections.',
      },
    ],
    sideEffects_hi: [
      'दस्त या पेट खराब होना',
      'जी मिचलाना या उल्टी',
      'पेट में हल्का दर्द',
      'पेनिसिलिन एलर्जी होने पर त्वचा पर चकत्ते',
    ],
    sideEffects_en: [
      'Diarrhea or upset stomach',
      'Nausea or vomiting',
      'Mild abdominal discomfort',
      'Skin rash (if allergic to penicillin)',
    ],
    warnings_hi: [
      {
        label: 'गर्भावस्था और स्तनपान',
        desc: 'गर्भावस्था में आमतौर पर डॉक्टर की देखरेख में सुरक्षित मानी जाती है।',
      },
      {
        label: 'अंगों से जुड़ी बीमारी',
        desc: 'किडनी या लिवर के गंभीर रोगियों को डॉक्टर की सलाह से खुराक तय करनी चाहिए।',
      },
      {
        label: 'शराब',
        desc: 'इलाज के दौरान शराब के सेवन से बचें क्योंकि यह दवा के असर को कम करती है।',
      },
      {
        label: 'डॉक्टर की सलाह',
        desc: 'हमेशा भोजन के साथ लें और पूरा कोर्स समाप्त करें; पेनिसिलिन एलर्जी होने पर न लें।',
      },
    ],
    warnings_en: [
      {
        label: 'Pregnancy & Breastfeeding',
        desc: 'Generally prescribed safely under physician supervision during pregnancy.',
      },
      {
        label: 'Organ Disease',
        desc: 'Dose adjustment may be required in severe kidney or liver impairment.',
      },
      {
        label: 'Alcohol',
        desc: 'Avoid alcohol while taking this antibiotic.',
      },
      {
        label: "Doctor's Advice",
        desc: 'Take with meals and complete the full prescribed course; avoid if allergic to penicillin.',
      },
    ],
  },

  // 9. Cetirizine / Montair-LC
  {
    triggers: ['cetirizine', 'cetzine', 'alerid', 'okacet', 'montair lc', 'montek lc', 'levocetirizine', 'सिट्रीजीन', 'मॉन्टेयर'],
    salt_en: 'Cetirizine / Levocetirizine + Montelukast',
    salt_hi: 'सिट्रीजीन / लेवोसिट्रीजीन और मोंटेलुकास्ट',
    isCombination: true,
    uses_hi: [
      {
        label: 'एलर्जी व छींक से राहत',
        desc: 'लगातार छींकें आना, बहती नाक, आंखों से पानी आना और नाक बंद होने में आराम।',
      },
      {
        label: 'त्वचा की खुजली व पित्ती',
        desc: 'त्वचा पर लाल दाने, खुजली, पित्ती उछलना और कीड़े के काटने की एलर्जी में असरदार।',
      },
    ],
    uses_en: [
      {
        label: 'Allergy & Cold Symptoms',
        desc: 'Relieves repeated sneezing, runny nose, itchy/watery eyes, and allergic cough.',
      },
      {
        label: 'Skin Hives & Itching',
        desc: 'Controls skin rashes, urticaria (hives), and itching from allergies.',
      },
    ],
    sideEffects_hi: [
      'नींद या सुस्ती आना',
      'मुंह सूखना',
      'थकान या सिर हल्का भारी लगना',
    ],
    sideEffects_en: [
      'Drowsiness or sleepiness',
      'Dry mouth',
      'Fatigue or mild headache',
    ],
    warnings_hi: [
      {
        label: 'गर्भावस्था और स्तनपान',
        desc: 'गर्भावस्था और स्तनपान के दौरान डॉक्टर की सलाह से ही लें।',
      },
      {
        label: 'अंगों से जुड़ी बीमारी',
        desc: 'किडनी की बीमारी वाले मरीजों को डॉक्टर से पूछकर कम डोज लेनी चाहिए।',
      },
      {
        label: 'शराब',
        desc: 'शराब के साथ इसका सेवन असुरक्षित है; इससे अत्यधिक नींद और चक्कर आ सकते हैं।',
      },
      {
        label: 'डॉक्टर की सलाह',
        desc: 'इसे रात को सोने से पहले लें और दवा लेने के बाद गाड़ी चलाने से बचें।',
      },
    ],
    warnings_en: [
      {
        label: 'Pregnancy & Breastfeeding',
        desc: 'Consult your doctor before use during pregnancy or breastfeeding.',
      },
      {
        label: 'Organ Disease',
        desc: 'Patients with kidney impairment may require reduced dosage.',
      },
      {
        label: 'Alcohol',
        desc: 'Unsafe with alcohol as it causes excessive drowsiness and impairs alertness.',
      },
      {
        label: "Doctor's Advice",
        desc: 'Best taken at night before sleep; avoid driving if you feel sleepy.',
      },
    ],
  },

  // 10. Telma 40 / Telmisartan
  {
    triggers: ['telma', 'telmikind', 'telpres', 'telmisartan', 'टेल्मा', 'टेल्मीसार्टन'],
    salt_en: 'Telmisartan (40mg / 80mg)',
    salt_hi: 'टेल्मीसार्टन (Telmisartan)',
    isCombination: false,
    uses_hi: [
      {
        label: 'हाई ब्लड प्रेशर नियंत्रण',
        desc: 'उच्च रक्तचाप (High BP) को कम करके रक्त वाहिकाओं को आराम देने के लिए।',
      },
      {
        label: 'हार्ट अटैक व स्ट्रोक से बचाव',
        desc: 'भविष्य में दिल के दौरे, स्ट्रोक और डायबिटीज में किडनी खराब होने के खतरे को कम करने में।',
      },
    ],
    uses_en: [
      {
        label: 'High Blood Pressure Control',
        desc: 'Lowers elevated blood pressure by relaxing tightened blood vessels.',
      },
      {
        label: 'Heart & Kidney Protection',
        desc: 'Reduces risks of heart attack, stroke, and diabetic kidney damage.',
      },
    ],
    sideEffects_hi: [
      'अचानक खड़े होने पर चक्कर आना',
      'थकान या कमजोरी महसूस होना',
      'कमर दर्द या साइनस में जकड़न',
      'खून में पोटेशियम का स्तर बढ़ना',
    ],
    sideEffects_en: [
      'Dizziness upon standing up quickly',
      'Fatigue or weakness',
      'Back pain or sinus congestion',
      'Elevated blood potassium levels',
    ],
    warnings_hi: [
      {
        label: 'गर्भावस्था और स्तनपान',
        desc: 'गर्भावस्था के दौरान इसका सेवन सख्त असुरक्षित है (गर्भस्थ शिशु को नुकसान पहुंचा सकती है)।',
      },
      {
        label: 'अंगों से जुड़ी बीमारी',
        desc: 'किडनी या लिवर के मरीजों को नियमित जांच और डॉक्टर की निगरानी में लेना चाहिए।',
      },
      {
        label: 'शराब',
        desc: 'शराब के साथ लेने पर ब्लड प्रेशर खतरनाक रूप से बहुत कम हो सकता है।',
      },
      {
        label: 'डॉक्टर की सलाह',
        desc: 'बीपी की दवा को कभी अचानक बंद न करें; रोज एक ही समय पर नियमित रूप से लें।',
      },
    ],
    warnings_en: [
      {
        label: 'Pregnancy & Breastfeeding',
        desc: 'Strictly unsafe during pregnancy as it can cause severe harm to the unborn baby.',
      },
      {
        label: 'Organ Disease',
        desc: 'Requires regular monitoring in patients with kidney or liver disorders.',
      },
      {
        label: 'Alcohol',
        desc: 'Alcohol can cause dangerously low blood pressure; avoid combining.',
      },
      {
        label: "Doctor's Advice",
        desc: 'Never stop blood pressure medication abruptly; take at the same time daily.',
      },
    ],
  },

  // 11. Meftal-Spas
  {
    triggers: ['meftal', 'meftalspas', 'spasmonil', 'colimex', 'cyclopam', 'मेफ्टाल'],
    salt_en: 'Mefenamic Acid and Dicyclomine',
    salt_hi: 'मेफेनैमिक एसिड और डाइसाइक्लोमाइन',
    isCombination: true,
    uses_hi: [
      {
        label: 'पेट दर्द व मरोड़ से राहत',
        desc: 'आंतों की ऐंठन, पेट में तेज मरोड़ और गैस के कारण होने वाले दर्द को शांत करने के लिए।',
      },
      {
        label: 'पीरियड्स (मासिक धर्म) का दर्द',
        desc: 'महिलाओं में पीरियड्स के दौरान होने वाले असहनीय पेट और कमर दर्द में राहत के लिए।',
      },
    ],
    uses_en: [
      {
        label: 'Abdominal Cramps & Spasms',
        desc: 'Relieves sudden stomach cramps, intestinal colic, and spasms.',
      },
      {
        label: 'Menstrual Pain',
        desc: 'Highly effective for relief from painful menstrual cramps (dysmenorrhea).',
      },
    ],
    sideEffects_hi: [
      'मुंह सूखना',
      'चक्कर आना या सुस्ती लगना',
      'धुंधला दिखाई देना',
      'मतली या पेट में जलन',
    ],
    sideEffects_en: [
      'Dry mouth',
      'Dizziness or drowsiness',
      'Blurred vision',
      'Nausea or mild acidity',
    ],
    warnings_hi: [
      {
        label: 'गर्भावस्था और स्तनपान',
        desc: 'गर्भावस्था और स्तनपान के दौरान इसे लेना असुरक्षित माना जाता है; डॉक्टर से पूछें।',
      },
      {
        label: 'अंगों से जुड़ी बीमारी',
        desc: 'किडनी, लिवर, ग्लूकोमा या पेट के अल्सर के मरीजों को इसे लेने से बचना चाहिए।',
      },
      {
        label: 'शराब',
        desc: 'शराब के साथ इसका सेवन असुरक्षित है; इससे चक्कर और बेहोशी बढ़ सकती है।',
      },
      {
        label: 'डॉक्टर की सलाह',
        desc: 'इसे हमेशा भोजन के बाद ही लें और लेने के बाद ड्राइविंग करने से बचें।',
      },
    ],
    warnings_en: [
      {
        label: 'Pregnancy & Breastfeeding',
        desc: 'Considered unsafe during pregnancy and breastfeeding without doctor approval.',
      },
      {
        label: 'Organ Disease',
        desc: 'Avoid if you suffer from kidney, liver, glaucoma, or stomach ulcer diseases.',
      },
      {
        label: 'Alcohol',
        desc: 'Unsafe with alcohol as it worsens dizziness and stomach irritation.',
      },
      {
        label: "Doctor's Advice",
        desc: 'Always take after food and avoid driving if you feel dizzy or blurred vision.',
      },
    ],
  },

  // 12. Glycomet / Metformin
  {
    triggers: ['glycomet', 'metformin', 'glucophage', 'ग्लाइकोमेट', 'मेटफॉर्मिन'],
    salt_en: 'Metformin Hydrochloride',
    salt_hi: 'मेटफॉर्मिन हाइड्रोक्लोराइड (Metformin)',
    isCombination: false,
    uses_hi: [
      {
        label: 'ब्लड शुगर नियंत्रण',
        desc: 'टाइप-2 डायबिटीज (मधुमेह) के मरीजों में बढ़े हुए ब्लड शुगर को नियंत्रित करने के लिए।',
      },
      {
        label: 'पीसीओएस (PCOS) में सहायक',
        desc: 'इंसुलिन की संवेदनशीलता सुधारने और महिलाओं में PCOS के इलाज में उपयोगी।',
      },
    ],
    uses_en: [
      {
        label: 'Blood Sugar Control',
        desc: 'Manages high blood sugar levels in Type 2 Diabetes Mellitus.',
      },
      {
        label: 'PCOS Support',
        desc: 'Improves insulin sensitivity and helps regulate hormones in PCOS.',
      },
    ],
    sideEffects_hi: [
      'पेट में गैस, दर्द या हल्के दस्त',
      'जी मिचलाना या भूख कम लगना',
      'मुंह में धातु जैसा स्वाद',
      'लंबे समय तक उपयोग में विटामिन B12 की कमी',
    ],
    sideEffects_en: [
      'Gas, stomach discomfort, or mild diarrhea',
      'Nausea or reduced appetite',
      'Metallic taste in mouth',
      'Vitamin B12 deficiency with long-term use',
    ],
    warnings_hi: [
      {
        label: 'गर्भावस्था और स्तनपान',
        desc: 'गर्भावस्था में केवल डॉक्टर की कड़ी निगरानी में ही उपयोग की जाती है।',
      },
      {
        label: 'अंगों से जुड़ी बीमारी',
        desc: 'किडनी या लिवर की गंभीर बीमारी से पीड़ित लोगों को इसे लेने से बचना चाहिए।',
      },
      {
        label: 'शराब',
        desc: 'शराब का सेवन इसके साथ सख्त असुरक्षित है (लैक्टिक एसिडोसिस का गंभीर खतरा)।',
      },
      {
        label: 'डॉक्टर की सलाह',
        desc: 'हमेशा भोजन के साथ या भोजन के तुरंत बाद लें और नियमित शुगर जांच कराते रहें।',
      },
    ],
    warnings_en: [
      {
        label: 'Pregnancy & Breastfeeding',
        desc: 'Used only under strict physician monitoring during pregnancy.',
      },
      {
        label: 'Organ Disease',
        desc: 'Contraindicated in severe kidney or liver impairment.',
      },
      {
        label: 'Alcohol',
        desc: 'Strictly unsafe with alcohol due to risk of lactic acidosis.',
      },
      {
        label: "Doctor's Advice",
        desc: 'Always take with or immediately after meals; monitor blood sugar regularly.',
      },
    ],
  },
];

/**
 * Free OpenFDA + Wikipedia fallback when user searches a drug outside local dictionary
 */
async function fetchOnlineMedicineData(displayName, cleanQuery) {
  // 1. Try OpenFDA first for official structured label data
  try {
    const fdaUrl = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:${encodeURIComponent(
      cleanQuery
    )}+OR+openfda.generic_name:${encodeURIComponent(cleanQuery)}&limit=1`;
    const res = await fetch(fdaUrl);
    if (res.ok) {
      const fda = await res.json();
      const item = fda?.results?.[0];
      if (item) {
        const generic = item?.openfda?.generic_name?.[0] || item?.openfda?.substance_name?.[0] || displayName;
        const rawIndication = (item?.indications_and_usage?.[0] || '').replace(/^\d+(\.\d+)?\s*[A-Z\s]+/, '').trim();
        const rawAdverse = (item?.adverse_reactions?.[0] || '').replace(/^\d+(\.\d+)?\s*[A-Z\s]+/, '').trim();

        return {
          salt_en: generic,
          salt_hi: generic,
          isCombination: generic.includes(',') || generic.includes('AND') || generic.includes('+'),
          uses_en: [
            {
              label: 'Clinical Indication',
              desc: rawIndication ? rawIndication.slice(0, 240) + (rawIndication.length > 240 ? '...' : '') : `Medically used for conditions indicated by ${generic}.`,
            },
          ],
          uses_hi: [
            {
              label: 'मुख्य चिकित्सीय उपयोग',
              desc: `यह दवा मुख्य रूप से ${generic} घटक पर आधारित है और संबंधित चिकित्सीय स्थितियों व लक्षणों के इलाज में डॉक्टर के परामर्श पर दी जाती है।`,
            },
          ],
          sideEffects_en: rawAdverse
            ? [rawAdverse.slice(0, 160) + '...']
            : ['Nausea, dizziness, or mild upset stomach'],
          sideEffects_hi: [
            'हल्की मतली या उल्टी',
            'पेट में बेचैनी या अपच',
            'चक्कर आना या सिरदर्द',
            'दुर्लभ मामलों में एलर्जी या दाने',
          ],
          warnings_hi: [
            {
              label: 'गर्भावस्था और स्तनपान',
              desc: 'गर्भावस्था और स्तनपान के दौरान इसे बिना डॉक्टर की सलाह के लेना असुरक्षित हो सकता है।',
            },
            {
              label: 'अंगों से जुड़ी बीमारी',
              desc: 'किडनी या लिवर की बीमारी से पीड़ित लोगों को डॉक्टर से पूछकर ही इसे लेना चाहिए।',
            },
            {
              label: 'शराब',
              desc: 'दवा के साथ शराब का सेवन असुरक्षित माना जाता है।',
            },
            {
              label: 'डॉक्टर की सलाह',
              desc: 'इसे लेने से पहले डॉक्टर या किसी नजदीकी स्वास्थ्य विशेषज्ञ से परामर्श अवश्य लें।',
            },
          ],
          warnings_en: [
            {
              label: 'Pregnancy & Breastfeeding',
              desc: 'Consult your doctor before use during pregnancy or breastfeeding.',
            },
            {
              label: 'Organ Disease',
              desc: 'Patients with kidney or liver disorders should consult a specialist.',
            },
            {
              label: 'Alcohol',
              desc: 'Alcohol consumption with this medication is considered unsafe.',
            },
            {
              label: "Doctor's Advice",
              desc: 'Always consult a qualified doctor or healthcare professional before taking it.',
            },
          ],
        };
      }
    }
  } catch (_e) {
    // proceed to Wikipedia
  }

  // 2. Try Wikipedia REST API
  try {
    const wikiClean = cleanQuery.replace(/\s+/g, '_');
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiClean)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.extract && data.type !== 'disambiguation') {
        const desc = data.description || 'Clinical Medication';
        return {
          salt_en: data.title,
          salt_hi: data.title,
          isCombination: false,
          uses_en: [
            {
              label: 'Overview & Usage',
              desc: data.extract.slice(0, 260) + (data.extract.length > 260 ? '...' : ''),
            },
          ],
          uses_hi: [
            {
              label: 'मुख्य उपयोग',
              desc: `${displayName} (${desc}) का उपयोग संबंधित स्वास्थ्य स्थितियों और लक्षणों में चिकित्सीय देखरेख में किया जाता है।`,
            },
          ],
          sideEffects_en: [
            'Nausea or vomiting',
            'Stomach discomfort or indigestion',
            'Headache or mild dizziness',
          ],
          sideEffects_hi: [
            'मिचली या उल्टी',
            'अपच, सीने में जलन या पेट दर्द',
            'सिरदर्द या चक्कर आना',
          ],
          warnings_hi: [
            {
              label: 'गर्भावस्था और स्तनपान',
              desc: 'गर्भावस्था और स्तनपान के दौरान डॉक्टर की सलाह के बिना सेवन असुरक्षित हो सकता है।',
            },
            {
              label: 'अंगों से जुड़ी बीमारी',
              desc: 'किडनी या लिवर की बीमारी से पीड़ित लोगों को इसे लेने से पहले डॉक्टर से सलाह लेनी चाहिए।',
            },
            {
              label: 'शराब',
              desc: 'दवा के दौरान शराब का सेवन करना असुरक्षित है।',
            },
            {
              label: 'डॉक्टर की सलाह',
              desc: 'इसे लेने से पहले डॉक्टर या किसी नजदीकी स्वास्थ्य विशेषज्ञ से परामर्श अवश्य लें।',
            },
          ],
          warnings_en: [
            {
              label: 'Pregnancy & Breastfeeding',
              desc: 'Taking this medicine during pregnancy and breastfeeding requires medical advice.',
            },
            {
              label: 'Organ Disease',
              desc: 'People with kidney or liver disease should consult a doctor first.',
            },
            {
              label: 'Alcohol',
              desc: 'Unsafe for people who consume alcohol.',
            },
            {
              label: "Doctor's Advice",
              desc: 'Consult a doctor or healthcare professional before taking this medicine.',
            },
          ],
        };
      }
    }
  } catch (_e) {
    // ignore
  }

  return null;
}

/**
 * Formats matched/fetched data into the exact structured format requested by the user.
 */
function buildFormattedResponse(displayName, data) {
  const oneMgUrl =
    data.oneMgUrl ||
    `https://www.1mg.com/search/all?name=${encodeURIComponent(displayName)}`;

  const intro_hi = data.isCombination
    ? `${displayName} ${data.salt_hi} का एक संयोजन (Combination) दवा है।`
    : `${displayName} मुख्य रूप से ${data.salt_hi} घटक वाली एक दवा है।`;

  const intro_en = data.isCombination
    ? `${displayName} is a combination medicine containing ${data.salt_en}.`
    : `${displayName} is a medication containing ${data.salt_en}.`;

  return {
    id: 'med-' + Date.now(),
    name: displayName,
    salt_hi: data.salt_hi,
    salt_en: data.salt_en,
    intro_hi,
    intro_en,
    usesIntro_hi: `${displayName} का उपयोग मुख्य रूप से निम्नलिखित स्थितियों में राहत पाने के लिए किया जाता है:`,
    usesIntro_en: `${displayName} is primarily used for relief in the following conditions:`,
    uses_hi: data.uses_hi,
    uses_en: data.uses_en,
    oneMgUrl,
    sideEffects_hi: data.sideEffects_hi,
    sideEffects_en: data.sideEffects_en,
    warnings_hi: data.warnings_hi,
    warnings_en: data.warnings_en,
  };
}

/**
 * Universal Medicine Resolver:
 * - Preserves exact user-typed medicine name
 * - Formats output identically to user's template
 * - Zero API keys required
 */
export async function resolveMedicine(rawQuery) {
  if (!rawQuery || typeof rawQuery !== 'string' || !rawQuery.trim()) {
    return null;
  }

  const query = rawQuery.trim();
  const clean = query
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const compactClean = clean.replace(/\s+/g, '');
  const tokens = clean.split(' ').filter(Boolean);

  // Format user's searched name nicely (Title Case unless mixed/hyphenated)
  const displayName = query.charAt(0).toUpperCase() + query.slice(1);

  // 1. Exact trigger match
  for (const item of BRAND_TO_CLINICAL) {
    for (const trig of item.triggers) {
      const compactTrig = trig.replace(/\s+/g, '').toLowerCase();
      if (clean === trig || compactClean === compactTrig) {
        return buildFormattedResponse(displayName, item);
      }
    }
  }

  // 2. Phrase contains trigger (e.g. "Ajubi tablet" contains "ajubi")
  for (const item of BRAND_TO_CLINICAL) {
    for (const trig of item.triggers) {
      const compactTrig = trig.replace(/\s+/g, '').toLowerCase();
      if (trig.length >= 3 && clean.includes(trig)) {
        return buildFormattedResponse(displayName, item);
      }
      if (compactTrig.length >= 3 && compactClean.includes(compactTrig)) {
        return buildFormattedResponse(displayName, item);
      }
    }
  }

  // 3. Exact word token match
  for (const item of BRAND_TO_CLINICAL) {
    for (const trig of item.triggers) {
      const compactTrig = trig.replace(/\s+/g, '').toLowerCase();
      for (const t of tokens) {
        if (t.length >= 3 && (t === trig || t === compactTrig)) {
          return buildFormattedResponse(displayName, item);
        }
      }
    }
  }

  // 4. Online open medical API fallback (OpenFDA & Wikipedia)
  const onlineData = await fetchOnlineMedicineData(displayName, clean);
  if (onlineData) {
    return buildFormattedResponse(displayName, onlineData);
  }

  // 5. Fallback formatted guide
  return buildFormattedResponse(displayName, {
    salt_hi: `${displayName} (औषधीय घटक)`,
    salt_en: `${displayName} (Active Pharmaceutical Compound)`,
    isCombination: false,
    uses_hi: [
      {
        label: 'मुख्य चिकित्सीय उपयोग',
        desc: `यह दवा डॉक्टर द्वारा निर्धारित स्वास्थ्य समस्याओं और लक्षणों में आराम दिलाने के लिए दी जाती है। सटीक साल्ट और उपयोग देखने के लिए नीचे Tata 1mg लिंक का उपयोग करें।`,
      },
    ],
    uses_en: [
      {
        label: 'Primary Medical Use',
        desc: `Prescribed for specific medical conditions and symptom relief as diagnosed by a physician. Tap the Tata 1mg link below for exact salt composition details.`,
      },
    ],
    sideEffects_hi: [
      'मिचली या उल्टी',
      'अपच, सीने में जलन या पेट दर्द',
      'हल्का सिरदर्द या चक्कर आना',
    ],
    sideEffects_en: [
      'Nausea or vomiting',
      'Indigestion, heartburn, or stomach ache',
      'Mild headache or dizziness',
    ],
    warnings_hi: [
      {
        label: 'गर्भावस्था और स्तनपान',
        desc: 'गर्भावस्था और स्तनपान के दौरान बिना डॉक्टर की सलाह के इसका सेवन असुरक्षित हो सकता है।',
      },
      {
        label: 'अंगों से जुड़ी बीमारी',
        desc: 'किडनी या लिवर की बीमारी से पीड़ित लोगों को इसे लेने से पहले डॉक्टर से परामर्श लेना चाहिए।',
      },
      {
        label: 'शराब',
        desc: 'दवा के साथ शराब का सेवन करना असुरक्षित है।',
      },
      {
        label: 'डॉक्टर की सलाह',
        desc: 'इसे लेने से पहले डॉक्टर या किसी नजदीकी स्वास्थ्य विशेषज्ञ से परामर्श अवश्य लें।',
      },
    ],
    warnings_en: [
      {
        label: 'Pregnancy & Breastfeeding',
        desc: 'Unsafe during pregnancy and breastfeeding without proper medical consultation.',
      },
      {
        label: 'Organ Disease',
        desc: 'People with kidney or liver disease should avoid taking without doctor guidance.',
      },
      {
        label: 'Alcohol',
        desc: 'Unsafe for people who consume alcohol.',
      },
      {
        label: "Doctor's Advice",
        desc: 'Always consult a doctor or healthcare specialist before taking it.',
      },
    ],
  });
}
