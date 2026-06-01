import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  auricSidebar: [
    {
      type: "doc",
      id: "overview",
      label: "Overview",
    },
    {
      type: "category",
      label: "Contracts",
      collapsed: false,
      items: [
        { type: "doc", id: "auric", label: "Auric Token" },
        { type: "doc", id: "vesting", label: "Token Vesting" },
        { type: "doc", id: "amm", label: "AuricAMM" },
      ],
    },
    {
      type: "doc",
      id: "deployment",
      label: "Deployment",
    },
  ],
};

export default sidebars;
