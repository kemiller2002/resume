// update-resume-clarity.js
// Usage:
//   node update-resume-clarity.js resume.json resume.updated.json

const fs = require("fs");

const [inputPath, outputPath = "resume.updated.json"] = process.argv.slice(2);

if (!inputPath) {
  console.error(
    "Usage: node update-resume-clarity.js resume.json resume.updated.json",
  );
  process.exit(1);
}

const resume = JSON.parse(fs.readFileSync(inputPath, "utf8"));

const upsertByName = (items, item) => {
  const index = items.findIndex((x) => x.name === item.name);
  if (index >= 0) items[index] = item;
  else items.unshift(item);
};

const upsertByTitle = (items, item) => {
  const index = items.findIndex((x) => x.title === item.title);
  if (index >= 0) items[index] = item;
  else items.unshift(item);
};

const upsertHighlightText = (items, item) => {
  const index = items.findIndex(
    (x) => x.text && x.text.toLowerCase().includes("created clarity"),
  );
  if (index >= 0) items[index] = item;
  else items.push(item);
};

const echelon = resume.employment.find((x) => x.company === "Echelon Foundry");

if (!echelon) {
  throw new Error("Could not find Echelon Foundry employment entry.");
}

resume.about = [
  "Technology executive with over 25 years of experience leading engineering organizations, scaling distributed teams, and delivering enterprise-grade solutions across financial, nonprofit, and consumer sectors. Proven ability to accelerate delivery timelines, reduce operational costs, and align technical innovation with strategic business outcomes. Founder of Echelon Foundry, creator of HelixNote, and developer of Clarity, an applied diagnostic and decision framework used in real-world investigations, executive decision support, and evidence-based reporting. Recognized with Microsoft’s MVP Award for technical leadership and community impact. Experienced in AI-enabled systems, modernization initiatives, distributed architectures, engineering leadership, and organizational transformation. As a trained chocolatier and former sous-chef in culinary competitions, I bring creativity, discipline, and attention to detail to every domain I lead. Public speaker and content contributor with an audience reach exceeding 18 million through conferences, technical publications, and community engagement.",
];

upsertHighlightText(resume.highlights, {
  display: true,
  text: "Created Clarity, an evidence-based decision framework now applied to executive decision support, investigations, modernization efforts, and complex diagnostic analysis",
});

echelon.executiveAccomplishments = [
  {
    highlight: "Founded Echelon Foundry,",
    details:
      "providing executive technology advisory services, AI-enabled solutions, modernization guidance, and investigative analysis across nonprofit, fintech, healthcare, and infrastructure domains.",
  },
  {
    highlight: "Created and maintain HelixNote,",
    details:
      "an AI-powered platform for structured documentation, evidence management, reporting, and diagnostic investigations.",
  },
  {
    highlight: "Created Clarity,",
    details:
      "a practical decision and diagnostic framework used to structure evidence, assumptions, decisions, risks, and reevaluation criteria in complex investigations and modernization initiatives.",
  },
  {
    highlight: "Developed the Echelon Diagnostic Framework,",
    details:
      "combining AI-assisted analysis, forensic investigation techniques, standards-based verification, and structured evidence evaluation.",
  },
  {
    highlight:
      "Applied these frameworks across digital, financial, healthcare, and physical domains,",
    details:
      "including modernization planning, diagnostic investigations, financial due diligence, healthcare case documentation, and infrastructure assessments.",
  },
  {
    highlight:
      "Delivered measurable improvements in diagnostic accuracy and audit traceability,",
    details:
      "through AI-driven automation, structured evidence capture, and repeatable analytical workflows.",
  },
  {
    highlight: "Integrated accessibility-first design principles,",
    details:
      "ensuring AI-assisted documentation and reporting workflows remain usable for low-vision and assistive technology users.",
  },
  {
    highlight: "Advised executives, boards, and investors,",
    details:
      "on modernization strategy, architecture governance, AI adoption, technology due diligence, and operational risk.",
  },
];

echelon.accomplishments = [
  {
    description:
      "Created and applied Clarity, a structured framework for evidence mapping, decision support, assumption tracking, and reevaluation planning",
    importance: 10,
  },
  {
    description:
      "Developed HelixNote, leveraging AI integration and prompt engineering to automate documentation workflows for complex healthcare, technical, and investigative cases",
    importance: 10,
  },
  {
    description:
      "Advised nonprofits and financial institutions on DAF architecture, modernization strategy, grant workflow design, and compliance risk mitigation",
    importance: 9,
  },
  {
    description:
      "Reviewed technology companies, fintech organizations, and operational models for investor-led acquisition, modernization, and funding evaluations",
    importance: 8,
  },
  {
    description:
      "Provided executive coaching and organizational advisory services focused on delivery maturity, engineering effectiveness, and decision quality",
    importance: 8,
  },
];

upsertByTitle(echelon.projects, {
  title: "Clarity Decision and Diagnostic Framework",
  description:
    "Designed and applied a structured framework for converting ambiguous problems into traceable evidence, assumptions, decisions, risks, and reevaluation paths",
  responsibilities: [
    "Framework design",
    "Evidence mapping",
    "Decision modeling",
    "Diagnostic workflow development",
    "Executive reporting",
  ],
  display: ["management", "architect"],
  importance: 10,
});

upsertByTitle(echelon.projects, {
  title: "HelixNote AI Documentation Platform",
  description:
    "Designed and implemented an AI-powered documentation, summarization, and reporting platform supporting healthcare investigations, modernization initiatives, diagnostics, and evidence-based analysis",
  responsibilities: [
    "Prompt engineering and AI model integration",
    "Workflow automation design",
    "Structured reporting architecture",
    "Accessibility-focused user experience design",
  ],
  display: ["architect", "developer"],
  importance: 10,
});

echelon.technologies = [
  "AI Integration",
  "Azure OpenAI Service",
  "OpenAI GPT-4",
  "LangChain",
  "Prompt Engineering",
  "Structured Decision Systems",
  "Clarity Framework",
  "HelixNote",
  "Architecture Assessment",
  "Agile Delivery",
  "AWS",
  "Azure",
  "Jira",
  "Financial Analysis",
  "Executive Advisory",
];

upsertByName(echelon.focusAreas.entries, {
  name: "Clarity decision framework",
  display: true,
  notes:
    "Applied framework for evidence mapping, assumption management, decision support, risk evaluation, and structured reevaluation",
  weight: 10,
  keywords: [
    "Clarity",
    "decision framework",
    "evidence mapping",
    "decision support",
    "risk analysis",
    "reevaluation",
  ],
});

upsertByName(resume.globalFocusAreas, {
  name: "Decision intelligence & diagnostic frameworks",
  display: true,
  weight: 10,
  roles: ["Echelon Foundry"],
  keywords: [
    "Clarity",
    "decision intelligence",
    "evidence mapping",
    "decision support",
    "diagnostic reasoning",
    "structured analysis",
  ],
  notes:
    "Creation and practical application of Clarity, a framework for evidence-based decision making, risk analysis, and diagnostic investigations.",
});

fs.writeFileSync(outputPath, JSON.stringify(resume, null, 2) + "\n");

console.log(`Updated resume written to ${outputPath}`);
