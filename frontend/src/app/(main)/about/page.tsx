import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "About RavenRank. Built by a Carleton student for Carleton students.",
};

export default function AboutPage() {
  return (
    <div className="max-w-[640px]">
      <Image src="/logo.png" alt="RavenRank" width={300} height={300} className="mb-8" />
      <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tighter leading-none">
        About
      </h1>

      <div className="mt-8 space-y-6 text-foreground/80 leading-relaxed">
        <p>
          RavenRank was created by a Carleton University student who wanted a
          better way to explore course data, grade distributions, and professor
          ratings, all in one place.
        </p>

        <p>
          Choosing courses every semester shouldn&apos;t feel like guesswork.
          RavenRank brings together publicly available data from the Carleton
          course calendar and RateMyProfessors so you can make more informed
          decisions about your schedule.
        </p>

        <h2 className="text-xl font-semibold tracking-tight pt-4">
          100% free, forever
        </h2>
        <p>
          RavenRank is completely free for all students and always will be.
          There are no paywalls, no premium tiers, no subscriptions, and no ads.
          This project was built to help Carleton students, not to make money.
          Nobody should have to pay just to look up course information.
        </p>

        <h2 className="text-xl font-semibold tracking-tight pt-4">
          Why this exists
        </h2>
        <p>
          There was no single tool that let Carleton students quickly look up
          grade distributions alongside professor reviews, compare how different
          instructors teach the same course, or browse departments at a glance.
          RavenRank fills that gap.
        </p>

        <h2 className="text-xl font-semibold tracking-tight pt-4">
          Data sources
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <span className="font-medium">Course catalog</span>: sourced from
            the official Carleton University academic calendar.
          </li>
          <li>
            <span className="font-medium">Professor ratings</span>: sourced
            from RateMyProfessors, including quality, difficulty, tags, and
            would-take-again percentages.
          </li>
          <li>
            <span className="font-medium">Grade distributions</span>: real
            aggregate grade data obtained through a FIPPA (Freedom of
            Information and Protection of Privacy Act) request to Carleton
            University.
          </li>
        </ul>

        <h2 className="text-xl font-semibold tracking-tight pt-4">
          Support the project
        </h2>
        <p>
          If you find RavenRank useful and want to support its development,
          you can buy me a coffee. This is entirely optional and the site will
          always remain free regardless.
        </p>
        <a
          href="https://buymeacoffee.com/duddus"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FFDD00] text-black font-medium text-sm hover:bg-[#FFDD00]/90 transition-colors duration-200"
        >
          Buy me a coffee
        </a>

        <h2 className="text-xl font-semibold tracking-tight pt-4">
          Disclaimer
        </h2>
        <p className="text-sm text-muted-foreground">
          RavenRank is an independent student project and is not affiliated with,
          endorsed by, or officially connected to Carleton University or
          RateMyProfessors. All trademarks belong to their respective owners.
        </p>
      </div>
    </div>
  );
}
