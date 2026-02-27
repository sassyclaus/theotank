export interface ShareTemplate {
  platform: "twitter" | "facebook" | "copy";
  label: string;
  getText: (referralUrl: string) => string;
  getUrl?: (referralUrl: string) => string;
}

export const shareTemplates: ShareTemplate[] = [
  {
    platform: "twitter",
    label: "Share on X",
    getText: (url) =>
      `350+ theologians. 2,000 years. One question.\n\nI just joined the waitlist for @TheoTank — you can ask Augustine, poll the Reformers, or get your sermon graded by Aquinas.\n\n${url}`,
    getUrl: (url) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        `350+ theologians. 2,000 years. One question.\n\nI just joined the waitlist for @TheoTank — you can ask Augustine, poll the Reformers, or get your sermon graded by Aquinas.\n\n${url}`,
      )}`,
  },
  {
    platform: "facebook",
    label: "Share on Facebook",
    getText: (url) =>
      `Found something interesting — TheoTank lets you ask theological questions to a panel of 350+ historical theologians (Augustine, Aquinas, Calvin, etc.) and get synthesized responses from each of them. They're also building a tool that grades sermons. Joining the waitlist: ${url}`,
    getUrl: (url) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    platform: "copy",
    label: "Copy link",
    getText: (url) => url,
  },
];
