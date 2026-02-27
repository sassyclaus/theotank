import { useState } from "react";
import { shareTemplates } from "@/data/share-templates";
import { Button } from "@/components/ui/Button";

interface ShareButtonsProps {
  referralUrl: string;
}

export default function ShareButtons({ referralUrl }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = referralUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {shareTemplates.map((template) => {
        if (template.platform === "copy") {
          return (
            <Button
              key="copy"
              variant="outline"
              size="sm"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                  Copy link
                </>
              )}
            </Button>
          );
        }

        const url = template.getUrl?.(referralUrl);
        if (!url) return null;

        return (
          <a
            key={template.platform}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-2 rounded-lg border border-text-secondary/30 bg-transparent px-3 text-xs font-medium text-text-primary transition-colors hover:bg-surface"
          >
            {template.platform === "twitter" && (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            )}
            {template.platform === "facebook" && (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 1.092.07 1.538.14v3.33a9.6 9.6 0 0 0-.837-.023c-1.187 0-1.643.45-1.643 1.617v2.494h4.244l-.728 3.667h-3.516v7.98C19.396 23.108 24 18.063 24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.628 3.875 10.35 9.101 11.691" />
              </svg>
            )}
            {template.label}
          </a>
        );
      })}
    </div>
  );
}
