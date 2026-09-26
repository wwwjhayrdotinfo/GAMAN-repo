// Phrases for the "connect" features.
// dialect: 'central' = standard Thai, 'northern' = Kham Mueang (Lanna).
// ⚠️ VERIFY Kham Mueang lines with a Chiang Mai local before demoing.
export const PHRASES = [
  { id: 'hello-n', thai: 'สวัสดีเจ้า', romanized: 'sà-wàt-dii jâo', english: 'Hello (friendly, Northern)', dialect: 'northern' },
  { id: 'recommend', thai: 'มีอะไรแนะนำไหม', romanized: 'mii à-rai náe-nam mái', english: 'What do you recommend?', dialect: 'central' },
  { id: 'aroi', thai: 'อร่อยมาก', romanized: 'à-ròi mâak', english: 'Very delicious!', dialect: 'central' },
  { id: 'lam', thai: 'ลำขนาด', romanized: 'lam khà-nàat', english: 'Super delicious! (Northern)', dialect: 'northern' },
  { id: 'thanks-n', thai: 'ขอบใจเจ้า', romanized: 'khàwp jai jâo', english: 'Thank you (Northern)', dialect: 'northern' },
  { id: 'bill', thai: 'เก็บเงินด้วย', romanized: 'gèp ngern dûai', english: 'Can I pay, please?', dialect: 'central' },
]

// Buttons the VENDOR taps on the flipped phone. The customer sees the English.
export const VENDOR_REPLIES = [
  { thai: 'ได้เลย', english: 'Sure, coming right up!', emoji: '👍' },
  { thai: 'หมดแล้ว', english: 'Sorry, it\'s sold out', emoji: '🙅' },
  { thai: 'กินเผ็ดได้ไหม', english: 'Can you eat spicy food?', emoji: '🌶️' },
  { thai: 'ทานที่นี่หรือกลับบ้าน', english: 'Eat here or take away?', emoji: '🥡' },
  { thai: 'รอสักครู่นะ', english: 'Please wait a moment', emoji: '⏳' },
  { thai: 'ลองอันนี้สิ อร่อย', english: 'Try this one, it\'s delicious!', emoji: '⭐' },
  { thai: 'มาจากไหน', english: 'Where are you from?', emoji: '🌏' },
  { thai: 'พูดไทยเก่งนะ', english: 'Your Thai is good!', emoji: '😄' },
]

// Quick answers the customer can say back (tap to hear it).
export const QUICK_ANSWERS = [
  { thai: 'ได้', romanized: 'dâai', english: 'Yes / I can' },
  { thai: 'ไม่ได้', romanized: 'mâi dâai', english: 'No / I can\'t' },
  { thai: 'นิดหน่อย', romanized: 'nít nòi', english: 'A little' },
  { thai: 'ทานที่นี่', romanized: 'thaan thîi nîi', english: 'Eat here' },
  { thai: 'กลับบ้าน', romanized: 'glàp bâan', english: 'Take away' },
]
