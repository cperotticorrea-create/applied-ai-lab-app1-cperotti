# Sales Pulse: Architecture Overview

Sales Pulse is an executive sales intelligence dashboard designed to transform raw transaction spreadsheets into clear, actionable regional performance insights. The application automatically normalizes sales order records, aggregates quarterly revenue across geographic regions, and calculates key quarter-over-quarter performance trends with a dedicated focus on shifts between Q2 and Q3. Powered by server-side Google Gemini artificial intelligence paired with deterministic mathematical calculations, Sales Pulse generates strictly grounded, three-sentence executive briefings that explain which region experienced the greatest revenue fluctuation and highlight the underlying product drivers, unit volumes, channel movements, and discount changes responsible.

## Project File Inventory

| File Path | Purpose |
| :--- | :--- |
| `.env.example` | Provides a configuration template detailing necessary environment variables, including the server port and Google Gemini API credentials. |
| `.gitignore` | Defines files and directories excluded from version control, such as compiled bundles, external dependencies, and local secret files. |
| `index.html` | Serves as the web entry point, establishing the HTML shell, page metadata, search engine tags, and the root mounting container for the React application. |
| `metadata.json` | Configures app identity and platform permission flags for AI Studio, granting necessary privileges for server-side Gemini AI features. |
| `package.json` | Specifies project package dependencies, executable scripts, and build configurations required to run and bundle the application. |
| `public/assets/aistudio/Lab_1_-_Regional_Sales_de1de499.csv` | Contains the default regional sales order dataset loaded on initial startup for immediate quarterly analysis. |
| `server.ts` | Operates the Node.js Express backend server that serves the frontend, exposes API endpoints, and coordinates Gemini executive summary generation. |
| `src/App.tsx` | Serves as the primary application view, managing data loading pipelines, calculated analytics state, and dashboard UI component composition. |
| `src/components/AiSummaryCard.tsx` | Presents the executive three-sentence intelligence summary that breaks down top regional revenue variances and business drivers. |
| `src/components/CsvUploader.tsx` | Provides an intuitive file upload interface enabling stakeholders to drop in new CSV files, load sample data, or download standard templates. |
| `src/components/Header.tsx` | Displays high-level executive metrics including total recognized revenue and order counts, alongside actions to trigger file uploads and data reloads. |
| `src/components/RawDataViewer.tsx` | Allows business users to explore, search, filter, and inspect raw underlying transaction records to audit individual sales orders. |
| `src/components/RevenueChart.tsx` | Visualizes regional revenue comparisons across quarters through interactive comparative bar charts. |
| `src/components/RevenueTable.tsx` | Renders a comprehensive pivot table detailing quarterly regional sales figures, percentage growth, total units, and average discount rates. |
| `src/index.css` | Implements global Tailwind CSS styling to ensure consistent typography, responsive cards, and clean visual hierarchy. |
| `src/main.tsx` | Serves as the client-side JavaScript entry point, bootstrapping the React application into the browser DOM. |
| `src/types.ts` | Declares standardized TypeScript data models for sales orders, quarterly performance metrics, driver breakdowns, and summary payloads. |
| `src/utils/calculations.ts` | Implements business logic that unifies regional naming variations, aggregates financial totals, and computes quarterly percentage changes and key drivers. |
| `src/utils/csvParser.ts` | Parses uploaded comma-separated value files into structured sales orders while cleaning currency symbols and validating data rows. |
| `src/utils/formatters.ts` | Provides shared utility functions to format currency, percentages, and large numbers into clean, human-readable presentation values. |
| `src/utils/sampleData.ts` | Stores fallback demonstration sales order transactions to ensure uninterrupted dashboard operation without requiring external file uploads. |
| `tsconfig.json` | Defines compiler settings, modern ECMAScript targets, and module resolution aliases for the TypeScript codebase. |
| `vite.config.ts` | Configures the Vite development server, React compilation plugins, and path aliases for application packaging. |
