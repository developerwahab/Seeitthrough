const lines = {
  BLUNT: {
    title: (t) => `Do it: ${t}`,
    body: (why) => (why ? `Reason: ${why}` : `Stop delaying.`),
  },
  SUPPORTIVE: {
    title: (t) => `You’ve got this: ${t}`,
    body: (why) =>
      why ? `Because ${why}. I’m with you.` : `Small step now → momentum.`,
  },
  NAGGY: {
    title: (t) => `Ping! ${t}`,
    body: (why) =>
      why ? `${why} — still not done.` : `Still pendin  g. Let’s go.`,
  },
  DRILL: {
    title: (t) => `Move! ${t}`,
    body: (why) => (why ? `${why}. No excuses.` : `Execute now.`),
  },
};
export function makeNotificationContent({ tone = "BLUNT", title, why }) {
  const T = lines[tone] || lines.BLUNT;
  return { title: T.title(title || "Your task"), body: T.body(why) };
}
 