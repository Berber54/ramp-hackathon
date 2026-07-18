import type { DemoConvo } from "./types";

/** Canned demo conversations — sacred for live demos. Do not analyze unknown data on stage. */
export const DEMO_CONVOS: DemoConvo[] = [
  {
    id: "cooked",
    label: "Try a demo convo",
    description: "The classic one-sided talking stage (very cooked)",
    defaultUserSender: "You",
    messages: [
      { sender: "You", text: "hey did you get home safe", time: "1:14 AM" },
      { sender: "Jordan", text: "ya", time: "9:32 AM" },
      { sender: "You", text: "cool cool. that party was fun tho right??", time: "9:33 AM" },
      { sender: "Jordan", text: "lol ya", time: "6:47 PM" },
      { sender: "You", text: "we should hang again soon! maybe coffee this week?", time: "6:48 PM" },
      { sender: "Jordan", text: "maybe", time: "Wed 11:20 PM" },
      { sender: "You", text: "ok what day works for you", time: "Wed 11:21 PM" },
      { sender: "Jordan", text: "idk im kinda busy rn", time: "Fri 8:10 PM" },
      { sender: "You", text: "no worries!! just lmk when you're free", time: "Fri 8:10 PM" },
      { sender: "Jordan", text: "k", time: "Sat 1:02 AM" },
      { sender: "You", text: "also I saw this meme and thought of you 😭", time: "Sat 1:03 AM" },
      { sender: "You", text: "hello??", time: "Sun 2:30 AM" },
      { sender: "Jordan", text: "lol", time: "Mon 7:15 PM" },
      { sender: "You", text: "so are we still on for anything or...", time: "Mon 7:16 PM" },
      { sender: "Jordan", text: "sorry was with friends", time: "Tue 10:41 PM" },
      { sender: "Jordan", text: "we'll see", time: "Tue 10:41 PM" },
    ],
  },
  {
    id: "healthy",
    label: "Healthy convo demo",
    description: "Mutual effort — should score low (actually valid)",
    defaultUserSender: "You",
    messages: [
      { sender: "You", text: "still good for Thursday at 7?", time: "12:15 PM" },
      { sender: "Sam", text: "Yes! I booked that pasta place you mentioned", time: "12:19 PM" },
      { sender: "Sam", text: "Also I got us tix for that comedy show next week if you're down", time: "12:20 PM" },
      { sender: "You", text: "wait that's so thoughtful, I'm definitely down", time: "12:22 PM" },
      { sender: "Sam", text: "How was your presentation today btw? You were nervous yesterday", time: "12:23 PM" },
      { sender: "You", text: "It went really well actually — thanks for asking 🥹", time: "12:31 PM" },
      { sender: "Sam", text: "Knew you'd crush it. Can't wait for Thursday", time: "12:33 PM" },
      { sender: "You", text: "Same!! See you then ❤️", time: "12:34 PM" },
      { sender: "Sam", text: "See you then 😊", time: "12:35 PM" },
    ],
  },
  {
    id: "mixed",
    label: "Mixed signals demo",
    description: "Hot and cold — mid-range cooked score",
    defaultUserSender: "You",
    messages: [
      { sender: "You", text: "had so much fun last night", time: "11:02 AM" },
      { sender: "Riley", text: "same omg you're actually hilarious", time: "11:40 AM" },
      { sender: "Riley", text: "we should do it again soon", time: "11:41 AM" },
      { sender: "You", text: "yes!! free this weekend?", time: "11:42 AM" },
      { sender: "Riley", text: "maybe saturday?", time: "3:15 PM" },
      { sender: "You", text: "perfect I'll plan something", time: "3:16 PM" },
      { sender: "Riley", text: "hey sorry super busy this week", time: "Thu 9:50 PM" },
      { sender: "You", text: "oh no worries, saturday still work?", time: "Thu 9:52 PM" },
      { sender: "Riley", text: "hmm might have to rain check", time: "Fri 8:30 PM" },
      { sender: "You", text: "ok just let me know!", time: "Fri 8:31 PM" },
      { sender: "Riley", text: "you're the best 💕", time: "Sat 12:20 AM" },
      { sender: "Riley", text: "sorry again lol", time: "Sat 12:20 AM" },
    ],
  },
];

export function getDemoConvo(id: string): DemoConvo | undefined {
  return DEMO_CONVOS.find((c) => c.id === id);
}
