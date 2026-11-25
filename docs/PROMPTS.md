# PROMPTS.md — AI-Assisted Engineering & Development Log

**Project:** TeddyPups — Blutec Technical Assessment  
**Reference:** https://puppy.instabizweb.com/  
**Repository:** `teddypups-clone-blutec`

## Project overview

TeddyPups is a reference-driven website reconstruction built with React, Vite, and TypeScript. The objective was to reproduce the reference website's visual design, interactions, animations, and responsive behaviour while introducing additional engineering improvements.

Beyond the core replication, I introduced **Arabic localization with full Right-to-Left (RTL) support** as a product-level enhancement.

### A key product decision: Arabic localization

One of the additional product opportunities I identified was introducing Arabic language support.

During my previous internship at CalorAI, I worked on frontend localization, including implementing Arabic and Turkish language experiences. When analysing the target website, I noticed that it catered to a Dubai/UAE audience. I saw an opportunity to apply that experience to this assessment and make the resulting product more relevant to its intended audience.

Rather than treating Arabic as a simple translation feature, I approached it as an application-wide engineering requirement.

The implementation included:

- A centralized Arabic translation dictionary and runtime translation layer.
- A language switch between English and Arabic.
- Application-wide RTL layout support.
- Arabic typography and font integration.
- Direction-aware component positioning and styling.
- Handling of mixed Arabic/English text and numerical content.
- RTL compatibility for animations, navigation, horizontal scrolling, and pinned sections.

The implementation was designed to preserve the existing React component architecture rather than maintain separate English and Arabic versions of every page.

This decision demonstrated how I could translate previous engineering experience into a product improvement, while considering the technical implications of introducing a second language into an existing application.

**Implementation status:** Arabic localization and RTL support have been implemented across the identified routes. Native-speaker review of the translations remains outstanding.

### Additional engineering highlights

| Area | Implementation |
|---|---|
| Arabic localization | Runtime translations and application-wide RTL support |
| Visual QA | Playwright automation and pixel-difference testing |
| Mascot engine | Ported SVG animation and scroll-driven behaviour |
| Interaction systems | Custom cursor, paw trail, page transitions, and animated scenes |
| CI/CD | GitHub Actions and Vercel deployment |
| Contact integration | EmailJS with Web3Forms fallback |
| Performance | Lighthouse-driven optimization, code splitting, and image optimization |
| Responsive design | Desktop and mobile validation across routes |

---

## My engineering approach

I approached the assignment as an engineering project rather than a code-generation exercise.

My responsibilities included:

- **Product and requirements:** Analysing the assessment, identifying opportunities for improvement, and defining acceptance criteria.
- **Architecture:** Selecting the technology stack, establishing the application structure, and deciding how reusable systems should be implemented.
- **Technical direction:** Breaking down complex requirements into implementation tasks and directing Claude Code through structured engineering prompts.
- **Validation:** Reviewing browser behaviour, identifying discrepancies, running automated checks, and measuring visual fidelity.
- **Delivery:** Managing the GitHub repository, deployment configuration, integrations, and submission preparation.

Claude Code was used as an AI-assisted implementation partner for code generation, repository exploration, debugging, and technical investigation. I retained responsibility for engineering decisions and evaluating whether the resulting implementation met the requirements.

**Documentation note:** The prompts in this file are reconstructed and refined representations of the instructions used during development, rather than verbatim chat transcripts.

---

## Tools and technologies

| Tool | Responsibility |
|---|---|
| Claude Code (Claude Sonnet 5.5) in VS Code | AI-assisted architecture exploration, implementation, debugging, and code review |
| Firecrawl CLI | Reference website reconnaissance and content extraction |
| Playwright (`playwright-core` + system Chromium) | Browser automation, screenshots, interaction testing, and console checks |
| pixelmatch / pngjs | Visual regression measurement |
| Python / Node.js / jq / curl | Reference analysis and automation scripts |
| Prettier | Un-minifying reference JavaScript for analysis |
| Vite | Development server and build tooling |
| React 18 + TypeScript | Application architecture |
| Tailwind CSS v4 | Styling infrastructure |
| React Router | Client-side routing |
| Lenis | Smooth scrolling |
| GitHub + GitHub Actions | Source control and continuous integration |
| Vercel | Deployment |
| EmailJS / Web3Forms | Contact form delivery |

---

# Engineering decision and implementation log

## 1. Assignment analysis and project planning

**Objective**

Convert the technical assessment into a structured development plan with clear milestones, priorities, and a delivery deadline.

Rather than immediately starting implementation, I first evaluated the scope of the assignment, the reference website, and the available development time.

**Engineering decisions**

- Established a 48-hour development window beginning 23 November at 6 PM.
- Prioritized reference analysis before implementation.
- Divided the work into reconnaissance, architecture, implementation, visual validation, deployment, and submission.
- Identified the need to reproduce both visual elements and interactive behaviour.

**Prompt**

> I have received a technical assessment from Blutec for the role. Analyse the assignment requirements and the reference website before we begin implementation.
>
> Break the work into a structured engineering plan covering:
>
> - Reference website reconnaissance.
> - Page and component inventory.
> - Technology and architecture decisions.
> - Implementation milestones.
> - Visual and functional testing.
> - Deployment and submission.
>
> We have a 48-hour deadline, so prioritize tasks based on implementation complexity, impact on the final result, and delivery risk.
>
> Do not start writing application code until we have a clear implementation plan.

**Outcome**

Established the development roadmap and accepted the assessment, starting the 48-hour window.

---

## 2. Technology selection and reference documentation

**Objective**

Select an appropriate frontend architecture and create a reusable reference pack that could serve as the source of truth throughout development.

**Engineering decisions**

I selected React, Vite, and TypeScript instead of reproducing the original Next.js stack.

The decision was based on the assessment's frontend requirements, implementation speed, and the need for a lightweight client-side application with multiple routes.

I also decided to extract the reference website's design information into documentation before implementation.

**Prompt**

> I want to use React with Vite and TypeScript for this project instead of Next.js.
>
> Before implementing the application, perform a structured reconnaissance of the reference website.
>
> Extract and organize the following:
>
> 1. Product requirements and page functionality.
> 2. Design system, colours, typography, spacing, and visual patterns.
> 3. Complete route and section inventory.
> 4. Animation and interaction specifications.
> 5. Reusable component opportunities.
> 6. Content and image assets.
> 7. Suggested application architecture and implementation sequence.
>
> Store the findings in a structured docs directory. Keep raw reference assets and extracted information separate from application source code.
>
> The documentation should be detailed enough that individual pages can be implemented without repeatedly rediscovering the reference website.

**Outcome**

Established React + Vite + TypeScript as the application stack.

Created:

- `docs/` — PRD, theme, sections, animations, architecture, tasks, page copy, and screenshots.
- `data/` — Structured puppy data containing 42 entries.
- `reference/` — Extracted HTML, CSS, and JavaScript.
- Asset manifest and download utilities.

---

## 3. Arabic localization and RTL support

**Objective**

Introduce Arabic localization as a product-level enhancement, rather than limiting the project to a visually accurate English-language replica.

**Product reasoning**

This was one of my deliberate product decisions.

During my previous internship at CalorAI, I had worked on localization, including implementing Arabic and Turkish language support and handling the associated frontend changes.

When evaluating additional features for this assessment, I noticed that the target website catered to a Dubai/UAE audience.

I saw an opportunity to apply my previous localization experience to the current project.

Rather than simply adding translated text, I wanted the application to support a genuine Arabic user experience with:

- Arabic typography.
- Right-to-left layout.
- Direction-aware component styling.
- Correct alignment and positioning.
- Mixed-direction text and numbers.
- A language switch that works across all routes.

This required treating localization as an application-wide concern rather than a page-level feature.

**Engineering decisions**

Instead of manually maintaining separate Arabic versions of every page, I chose a runtime localization architecture.

This included a translation dictionary, reusable translation mechanisms, and a dedicated RTL stylesheet.

The goal was to avoid duplicating page implementations and keep the English and Arabic experiences synchronized.

**Prompt**

> I want to introduce Arabic localization and full RTL support as an additional product feature.
>
> The reference website targets a Dubai/UAE audience, and I believe Arabic support would be a meaningful improvement.
>
> I have previously worked on Arabic localization, so I want to implement this properly rather than simply translating visible text.
>
> First, audit the existing application and identify:
>
> 1. All user-facing English strings.
> 2. Components that depend on left-to-right positioning.
> 3. Layouts that need direction-aware behaviour.
> 4. Mixed Arabic/English content and numerical formatting.
> 5. Animations and interactions that could break under RTL.
>
> Design a localization architecture that allows English and Arabic to coexist without duplicating the page components.
>
> Implement a runtime translation layer, centralized Arabic dictionary, Arabic typography, language switching, and a dedicated RTL stylesheet.
>
> Pay particular attention to navigation, forms, horizontal scrolling, pinned sections, icons, directional animations, and mixed-direction content.
>
> Preserve the existing English experience and avoid introducing regressions.
>
> After implementation, crawl every route for untranslated strings and capture desktop and mobile screenshots for both languages.

**Outcome**

Implemented an application-wide Arabic localization system.

The initial audit identified:

- 709 user-facing strings.
- Approximately 5,000 lines of physical-direction-dependent CSS.

Implemented:

- Centralized Arabic translation dictionary and templates.
- Runtime translation layer.
- MutationObserver-based translation handling.
- Arabic font integration.
- Language toggle.
- Dedicated RTL stylesheet.
- Direction-aware layout corrections.
- Mixed-direction number handling.
- RTL fixes for switches, signposts, pinned scrolling, and other components.
- Corrected footer email rendering.

**Validation**

Captured screenshots across all routes at 1440 px and 390 px and re-crawled the pages for untranslated strings.

**Known limitation:** Arabic translations still require a native-speaker review.

---

## 4. Reference reconnaissance and extraction tooling

**Objective**

Build a repeatable process for extracting reference information instead of manually inspecting every page and asset.

**Engineering decisions**

- Selected Firecrawl CLI for website extraction.
- Used browser screenshots to understand visual layouts.
- Used local scripts to inspect downloaded HTML, CSS, and JavaScript.
- Kept reference material separate from the application's implementation.

**Prompts**

> Set up Firecrawl CLI if it is not already installed. Check the available installation options and install it in a user-accessible location without modifying system directories unnecessarily.

> Firecrawl is now authenticated. Start the reference extraction process using the existing documentation structure.
>
> Capture the website's pages, content, links, images, and relevant visual information. Respect rate limits and organize the output so that it can be used during implementation.

**Outcome**

Firecrawl was installed in `~/.local`. Authentication was completed manually because keyless mode was blocked.

Reference extraction was throttled to accommodate the free-tier rate limit.

---

## 5. Application architecture and initial implementation

**Objective**

Establish the application foundation before implementing individual pages.

**Engineering decisions**

Defined the initial application structure around:

- Shared layout and navigation.
- Route-based page organization.
- Reusable UI components.
- Centralized puppy data.
- Shared styling infrastructure.
- Smooth scrolling and animation support.

The intention was to avoid implementing every page as an isolated component.

**Prompt**

> Based on the approved architecture and extracted documentation, implement the initial application foundation.
>
> Establish the Vite + React + TypeScript project with:
>
> - React Router configuration.
> - Shared header and footer.
> - Reusable layout components.
> - Centralized puppy data and route handling.
> - Tailwind CSS v4 integration.
> - Lenis smooth scrolling.
> - Responsive layout foundations.
>
> Implement the initial home page and ensure that every identified route has a working structural foundation.
>
> Keep components modular and avoid duplicating shared functionality. Do not introduce unnecessary dependencies.

**Outcome**

Implemented the initial application foundation and first version of the home page.

A browser review revealed substantial differences in visual fidelity and micro-interactions. This led to a change in the implementation strategy.

---

## 6. Reference-driven reconstruction and visual QA architecture

**Objective**

Move from an approximate visual recreation to a near one-to-one implementation.

**Engineering decision**

I rejected the initial approach of independently recreating the reference site's appearance.

Instead, I chose a reference-driven reconstruction strategy: extract and reuse the reference's existing styling and structural patterns wherever practical, while rebuilding the application behaviour within React.

This reduced the risk of accumulating small visual discrepancies across pages.

**Prompt**

> The initial implementation is functional, but the visual and behavioural differences from the reference are too significant.
>
> I want to change our implementation strategy. The target is a one-to-one replica, not a visually inspired recreation.
>
> Analyse the reference's compiled HTML, CSS, JavaScript, and animation behaviour. Identify which parts can be reused or systematically translated into our React architecture.
>
> I want you to:
>
> 1. Separate the reference CSS into maintainable layers.
> 2. Identify reusable component styles and preserve their original visual properties.
> 3. Build reusable HTML-to-JSX and section extraction utilities where useful.
> 4. Create a visual QA script that captures corresponding sections from both websites.
> 5. Calculate pixel mismatch percentages instead of relying exclusively on visual inspection.
>
> Preserve the existing application architecture where possible. Do not blindly overwrite working components.
>
> Work incrementally, beginning with the shared layout and then individual pages. Every implementation should be validated against the reference before moving forward.

**Outcome**

Changed the reconstruction strategy from independent styling to reference-driven implementation.

Developed:

- Tailwind v4 CSS layers.
- Approximately 4,900 lines of extracted component-specific CSS.
- DOM and HTML-to-JSX extraction utilities.
- Section and page generation scripts.
- A Playwright-based visual QA harness.
- Pixel comparison reporting.

Third-party website-cloning skills were evaluated but not installed because their implementation could not be reviewed adequately.

**Validation**

Established page-by-page visual comparison as the primary acceptance criterion.

---

## 7. Implementation sequencing and development continuity

**Objective**

Preserve the architecture and implementation decisions while switching Claude accounts, and establish the next development priorities.

**Engineering decisions**

I decided to prioritize inner pages before spending additional time on home page animation polish.

The reasoning was to establish complete route coverage and consistent shared components before refining decorative behaviour.

**Prompts**

> I may need to switch Claude accounts during development. Identify the best way to preserve the current project context, architectural decisions, completed tasks, and remaining work so that implementation can continue without losing progress.

> Review the current implementation against the reference. Considering the remaining deadline, should we prioritize inner-page fidelity or continue refining the home page?
>
> Evaluate the current gaps and recommend an implementation sequence that minimizes rework and ensures complete route coverage.

**Outcome**

Established the implementation order:

1. Shared application shell.
2. Inner pages.
3. Puppy detail pages.
4. Home page interactions and animations.
5. Final visual refinement.

Maintained project continuity through repository documentation and implementation notes.

---

## 8. Complete route implementation

**Objective**

Implement every identified route using reusable components and the established reference-driven styling strategy.

**Engineering decisions**

I divided the website into independent page-level implementation tasks while retaining shared components and centralized data.

Puppy detail pages were implemented using a data-driven architecture rather than creating 42 independent page implementations.

**Prompt**

> Implement the remaining routes using the established architecture and extracted reference documentation.
>
> Follow the page inventory and preserve the reference's layout, typography, spacing, imagery, responsive behaviour, and interactions.
>
> The implementation should cover:
>
> - Home page.
> - Puppy listing and filtering.
> - Dynamic puppy detail pages.
> - Gone-home page.
> - Happy families gallery and photo viewer.
> - How it works page and tabs.
> - FAQ search.
> - Contact page.
> - 404 page.
>
> Use reusable components wherever possible. Puppy detail pages must be data-driven and support all 42 entries through a common page template.
>
> After implementing each route, capture corresponding screenshots at the same viewport dimensions as the reference and report the visual differences.
>
> Do not move on from a page until its major discrepancies have been addressed.

**Outcome**

Implemented all identified routes, including:

- Shared header, footer, mobile dialog menu, and WhatsApp bar.
- Eight home page scenes.
- Puppy listing with functional filters.
- Dynamic detail pages for 42 puppies.
- Gone-home and happy-families pages.
- Photo viewer.
- How-it-works tabs.
- Searchable FAQ.
- Contact page animation.
- 404 page.

**Measured visual results at 1440 px**

| Area | Pixel mismatch |
|---|---:|
| Header, footer, home sections | 0–0.5% |
| Inner pages | 0.03–0.7% |
| Puppy detail pages | 0.08–0.34% |

These measurements refer to the tested screenshots and should not be interpreted as proof of identical behaviour or rendering in every browser.

---

## 9. Custom cursor and interactive paw trail

**Objective**

Reproduce the reference's custom paw cursor and create a smooth cursor-driven paw trail.

**Engineering decisions**

I identified two separate requirements:

- Replace the browser's default pointer with the custom paw cursor.
- Implement a trail that responds to pointer movement rather than page scrolling.

During reference analysis, I discovered that the original website's paw prints were generated by its walking mascot. However, I deliberately chose a cursor-driven trail as the desired behaviour for this implementation.

I refined the trail through multiple visual testing rounds, adjusting print density, spacing, and fade duration.

**Prompts**

> Analyse how the reference website implements its custom paw cursor. Identify the original cursor assets and reproduce the same cursor behaviour in our application.
>
> In addition, implement a cursor-driven paw trail. The trail must respond to pointer movement rather than scroll events.
>
> Use a reusable implementation with controlled print density, spacing, opacity, and fade duration. Avoid generating excessive DOM elements on every pointer event.
>
> Validate the result through repeated pointer movement at different speeds and adjust the trail until the movement feels natural.

> The current implementation still has three problems:
>
> - The trail is too dense.
> - The cursor sometimes falls back to the browser's default pointer.
> - The trail is not smooth when moving the pointer slowly.
>
> Investigate the asset-loading issue and the trail-generation logic. Adjust the spacing and print frequency independently, and ensure the custom cursor works consistently.

**Outcome**

Implemented:

1. Original paw cursor and pressed-state assets.
2. PNG-first cursor loading with SVG fallback.
3. Cursor-driven trail.
4. A reusable trail pool of 16 prints.
5. One print per approximately 38 px of pointer travel.
6. 20 px offset behind the pointer.
7. 2.6-second fade duration.

Fixed a browser caching issue caused by an earlier failed asset lookup.

---

## 10. Project documentation and implementation planning

**Objective**

Maintain an engineering record of the implementation decisions and document the reasoning behind complex visual behaviour.

**Engineering decision**

I separated the implementation details from the prompt history so that technical reviewers could understand not just what was built, but how it was engineered.

**Prompt**

> Review the current project and update the engineering documentation.
>
> Create two complementary documents:
>
> 1. PROMPTS.md — Record the requirements, architectural decisions, development prompts, implementation outcomes, and validation performed.
> 2. IMPLEMENTATION.md — Explain the actual technical implementation of complex interactions, including the paw trail, horizontal scrolling, reveal animations, mascot behaviour, and the problems encountered during development.
>
> Document the reasoning behind each implementation rather than simply listing completed features. Include relevant file paths, technical trade-offs, and known limitations.

**Outcome**

Created the prompt/development log and the technical implementation document.

---

## 11. Deployment architecture and mascot engine

**Objective**

Establish a publicly accessible deployment early and then implement the original website's mascot animation engine.

**Engineering decisions**

I prioritized deployment before further animation work to reduce delivery risk.

After establishing GitHub and Vercel, I decided to port the mascot's underlying animation logic instead of recreating its movement through unrelated CSS animations.

**Prompts**

> Prepare the project for GitHub and Vercel deployment.
>
> Use an appropriate repository name, review the existing Git configuration, and push the completed application to GitHub.
>
> Check whether a Vercel project is already connected. If not, prepare the project for deployment and identify any configuration I need to complete manually.

> The deployment is complete. Next, analyse the original website's SVG mascot animation system.
>
> I want to understand the mascot's rig, animation states, movement logic, and scroll-dependent behaviour before porting it.
>
> Implement a modular mascot engine in `src/lib/mascot/` that reproduces the original movement and animation behaviour.
>
> Preserve the original SVG geometry and validate the mascot's position at equivalent scroll offsets on both websites.

**Outcome**

- Created and pushed `teddypups-clone-blutec`.
- Created and deployed the Vercel project.
- Identified deployment protection settings that needed to be adjusted for reviewer access.
- Analysed the original mascot engine.
- Implemented the mascot engine under `src/lib/mascot/`.
- Fixed truncated SVG path data discovered during implementation.

**Validation**

Compared mascot positions at nine scroll offsets across desktop and mobile viewports (1440 px and 390 px).

---

## 12. Page transitions and scroll-driven plane animation

**Objective**

Identify and implement missing animated elements that were not covered by the initial page reconstruction.

**Engineering decision**

During side-by-side testing, I identified two important omissions: the original loading curtain during page transitions and the animated plane appearing in the home and how-it-works sections.

I treated these as shared animation systems rather than isolated decorative elements.

**Prompt**

> Compare the current implementation against the reference, focusing specifically on page transitions and scroll-driven animations.
>
> I have identified two missing behaviours:
>
> 1. A loading curtain with the running Teddy animation that appears during initial loading and route transitions.
> 2. A scroll-driven plane animation appearing in the home page and How It Works section.
>
> Analyse the original implementation and reproduce these behaviours within our existing architecture.
>
> Also inspect the step-card animations in How It Works.
>
> Ensure that transitions are synchronized correctly and that the animations behave consistently across routes.
>
> Validate the implementation through browser event logs and side-by-side scroll comparisons.

**Outcome**

Implemented the loading curtain, running mascot animation, scroll-driven plane, and missing step-card animation.

---

## 13. Home page hero lineup animation

**Objective**

Reproduce the dynamic puppy lineup interaction in the hero section.

**Engineering decision**

I identified that the hero section was missing a distinctive interaction from the original website: puppies randomly swapping positions while displaying their names.

I used a reference screenshot and the original website's observed behaviour to define the expected result.

**Prompt**

> The home page hero is still missing an important interaction from the original website.
>
> After the initial entrance animation, individual puppy images should periodically duck down, transition to another puppy, and pop back up.
>
> A name bubble should appear during the interaction. Hovering over a puppy should also display its corresponding name.
>
> Analyse the reference behaviour and implement the lineup logic using the existing puppy data.
>
> Preserve the entrance animation and avoid conflicts between the automatic swapping behaviour and user hover interactions.
>
> Validate the timing, animation sequence, and displayed names against the original.

**Outcome**

Ported the original lineup behaviour, including:

- Random puppy selection.
- Duck-and-swap animation.
- Pop-up entrance.
- Name bubbles.
- Hover-triggered name display.

Validated using a 16-second event log comparison.

---

## 14. CI, documentation, and production contact form

**Objective**

Improve the engineering quality of the project beyond the basic visual replication requirements.

**Engineering decisions**

I identified several opportunities to make the submission more production-oriented.

I prioritized:

1. Continuous integration.
2. Project documentation.
3. Functional contact form.
4. Custom-designed email notifications.
5. Responsive fixes.

I deliberately deferred code splitting until the performance optimization stage.

For contact delivery, I chose to integrate Web3Forms with EmailJS rather than implementing a backend solely for handling contact submissions.

**Prompts**

> The core website is now very close to the reference. I want to improve the engineering quality of the submission and demonstrate that this is more than a static frontend clone.
>
> Evaluate potential improvements such as CI, automated checks, documentation, contact form integration, accessibility, and performance.
>
> Rank them by engineering value, implementation effort, and relevance to the assessment. Recommend an implementation sequence.

> Set up a GitHub Actions workflow that performs dependency installation, TypeScript checks, and production builds on pushes and pull requests.
>
> Keep the workflow lightweight and consistent with our existing project configuration.

> Update the README to explain the project architecture, setup instructions, technology stack, features, and deployment process.
>
> Push the documentation and CI changes to GitHub. Also explain how the CI pipeline works and when I should use it during development.

> Analyse the current contact form and recommend a reliable way to deliver submissions to my email without introducing an unnecessary backend.
>
> I want proper form validation, submission feedback, and a fallback mechanism if the primary email service fails.

> The default notification email looks generic and does not match the website.
>
> Design a custom HTML email template consistent with the TeddyPups visual identity.
>
> Include the puppy's name instead of its internal ID, hide empty optional fields, and make the email readable across common email clients.

> Implement the custom HTML email using EmailJS and retain Web3Forms as a fallback.
>
> Verify the Gmail integration and test the complete submission flow.

> Review the remaining mobile discrepancies. Compare the reference and our implementation at 390 px and identify the underlying causes before applying fixes.
>
> Avoid introducing desktop regressions.

**Outcome**

Implemented:

- GitHub Actions CI workflow.
- Updated project README.
- Web3Forms contact submission.
- Custom HTML email notifications through EmailJS.
- Web3Forms fallback.
- Responsive correction for the Happy Families page at 390 px.

Also investigated the EmailJS Gmail integration error and resolved the 412 response.

---

## 15. Performance engineering and Lighthouse optimization

**Objective**

Optimize the application after establishing feature completeness and visual fidelity.

**Engineering decision**

I chose performance optimization as the next major engineering milestone.

Rather than applying arbitrary optimizations, I established Lighthouse measurements as the basis for identifying bottlenecks and evaluating changes.

I also decided to address loading performance and bundle size without compromising the visual fidelity achieved in earlier stages.

**Prompts**

> Before we finalize the project, audit the application for additional engineering improvements.
>
> Evaluate performance, accessibility, bundle size, loading behaviour, SEO, and responsive rendering.
>
> Prioritize improvements according to measurable user impact and implementation effort.

> Start performance optimization.
>
> First establish a Lighthouse baseline for every route. Identify the largest performance bottlenecks and create an optimization plan based on the measurements.
>
> Consider:
>
> - Route-level code splitting.
> - Lazy loading and prefetching.
> - Image format and image delivery optimization.
> - JavaScript bundle size.
> - Arabic localization bundle isolation.
> - Layout stability and Core Web Vitals.
> - SEO metadata, robots.txt, and sitemap.xml.
>
> Implement changes incrementally. After every major change, rerun Lighthouse and compare the results against the baseline.
>
> Do not accept an optimization that improves one metric while causing a significant regression elsewhere.
>
> Pay particular attention to CLS and ensure that lazy-loaded routes do not introduce layout shifts.

**Outcome**

Implemented:

- Route-level code splitting.
- Idle route prefetching.
- Arabic dictionary isolation from the English bundle.
- Build-time WebP variants.
- Runtime `srcset` image delivery.
- Logo and favicon optimization.
- `robots.txt`.
- `sitemap.xml`.

A layout-shift regression was identified after introducing `React.lazy`, producing a CLS of 0.97 in the affected test.

Resolved it using a synchronous page wrapper and landing-chunk preloading.

**Validation**

Measured Lighthouse performance before and after optimization.

The puppy detail page remains an identified performance gap, with a reported Lighthouse performance score of 83 and LCP of 4.3 seconds.

Refer to IMPLEMENTATION.md for detailed implementation notes and measurements.

---

# Remaining tasks

As of 25 November 2026:

- [ ] Record the Loom walkthrough.
- [ ] Prepare and submit the final assessment email.
- [ ] Improve puppy detail page performance (LCP: 4.3 seconds).
- [ ] Obtain native-speaker validation of Arabic translations.
- [ ] Resolve the 768 px Happy Families page height discrepancy (26 px).

---

# Engineering topics to explain during the walkthrough

The project involved several engineering decisions that are worth explaining rather than simply demonstrating visually.

### Architecture and implementation

- Why React + Vite + TypeScript was selected over Next.js.
- How the route structure and reusable component architecture were designed.
- Why the reference's CSS was reused rather than independently recreated.
- How the data-driven puppy detail pages support 42 entries.
- How the mascot engine was ported into a modular implementation.

### Product decisions

- Why Arabic localization was selected as a product differentiator.
- How previous localization experience at CalorAI influenced that decision.
- Why runtime localization and a shared component architecture were preferred over separate translated pages.
- How RTL considerations influenced component and animation implementation.
- Why performance optimization was prioritized after feature completeness.

### AI-assisted engineering

- How Claude Code was used as an implementation partner.
- How large tasks were decomposed into smaller engineering instructions.
- How reference documentation was used to provide context to the coding agent.
- How implementation changes were reviewed and validated.
- How browser automation and visual regression measurements were used to avoid accepting incorrect output.

### Quality and delivery

- How pixel mismatch measurements were calculated.
- How Playwright was used for visual and behavioural testing.
- How CI validates the application.
- How the contact form and email fallback work.
- What performance issues remain and why they have not yet been considered complete.

---

## Engineering ownership statement

The project was developed using an AI-assisted engineering workflow.

I defined the requirements, selected the architecture and implementation strategy, made product and technical decisions, prioritized development milestones, and established the validation criteria.

I also identified opportunities to extend the original requirements, including Arabic localization for the target audience, and applied previous engineering experience to those decisions.

Claude Code accelerated implementation, code exploration, debugging, and iterative refinement. Final implementation decisions were evaluated against the project requirements and reference behaviour.

The objective was to use AI to accelerate engineering execution while retaining responsibility for product direction, technical decisions, and implementation quality.