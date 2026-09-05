# Cheongcheopjang Gathering Scheduler PRD

Written: 2026-09-05

Version: v1 - Figma prototype scope

## 1. Background And Purpose

### Background

In the three months before a wedding, couples may need to meet 40 to 100 people to deliver invitations. They currently create a separate chat room for each gathering, which makes it hard to answer three practical questions: who should meet together, which candidate time works, and whether either partner has a conflicting commitment.

The work is shared, but the contact pools begin separately: one partner owns most contacts on their side, while some gatherings require both partners. A contact can belong to multiple groups, and responses often arrive late.

### Purpose

Provide one shared planning space in which a couple can manage contacts, form invitation gatherings, collect availability, confirm a date, and see all confirmed commitments without collisions. The product should make pending work and risk visible before the wedding date.

### Target Users

| User type | Age range | Role | Primary job |
| --- | --- | --- | --- |
| Couple planner | Late 20s to late 30s | Bride or groom planning the wedding | Organize contacts and gatherings, request availability, decide dates, avoid conflicts together |
| Invitee | Adult invited to one or more gatherings | Friend, colleague, family member, or senior colleague | Review proposed times and answer availability with minimal effort |

## 2. Solution And Features

### Core Solution

The service is a shared couple workspace, not a personal calendar. It connects five objects in one flow:

`contact -> group -> gathering -> availability poll -> confirmed schedule`

Both partners can see the same plan. Ownership tags clarify whose relationship a contact is, while a joint-gathering option makes meetings that require both partners explicit. Invitees use a lightweight response view reached from an invitation link; they do not need the full organizer workspace.

### Entry-State Rule

The organizer's first screen is stateful and gives one clear next action.

| Workspace state | First-screen priority | Primary CTA |
| --- | --- | --- |
| No gathering has been created | Start the first scheduling task | Create a new gathering |
| One or more gatherings exist and responses are missing | Resolve the most urgent outstanding response task | Check unanswered invitees |
| All responses are in and a date is chosen | Complete the organizer's handoff | Share the confirmed schedule |

### Core Features

| Feature | Description | Priority |
| --- | --- | --- |
| Shared couple workspace | Shows both partners' plans and identifies the owner or joint nature of each contact and gathering | High |
| Contact pool | Create, edit, search, and tag contacts with name, relationship, contact method, and owner | High |
| Multiple group membership | Assign one contact to more than one group without duplicating the contact record | High |
| Gathering builder | Create a 1:1 or group gathering from selected contacts; show its member count and side ownership | High |
| Candidate-time poll | Add multiple candidate dates and a response deadline to a gathering | High |
| Invitee response | Let invitees mark each candidate as available or unavailable from a focused link view | High |
| Response tracking | Show available, unavailable, and unanswered people per candidate; expose overdue responses | High |
| Confirm and share | Select the final time, notify all participants, and change the gathering to confirmed | High |
| Unified schedule | Display confirmed gatherings for both partners together and highlight overlapping commitments | High |
| Status queue | Separate awaiting responses, ready to confirm, confirmed, and completed gatherings | High |
| Reminder action | Give the organizer a clear follow-up action for unanswered people after or near the deadline | Medium |
| Urgent gathering flag | Mark late-created or wedding-near gatherings so they are visible in planning views | Medium |
| Filters and search | Filter contacts and gatherings by owner, relationship, status, or date range | Medium |
| Suggested grouping or times | Recommend possible groups or candidate times | Low |
| External calendar sync | Sync confirmed schedules to an external calendar | Low |

### Scope For The First Prototype

The first Figma result must show the complete happy path plus three risks: duplicated group membership, late response, and an overlapping confirmed schedule. It does not need production authentication, messaging, notifications, calendar sync, or automated recommendations.

## 3. Service Structure

### Information Architecture

| Menu | Purpose |
| --- | --- |
| Overview | Shared dashboard of urgent work, status counts, upcoming confirmed gatherings, and conflicts |
| Contacts | Searchable contact pool with relationship, owner, and multi-group membership |
| Gatherings | List and detail views for creation, candidate-time collection, response tracking, confirmation, and completion |
| Calendar | Combined schedule for both partners with conflict detection and filtering |
| Invitee response | Link-accessed focused page for reviewing a gathering and submitting availability |

### Main User Flows

#### Organizer: create and confirm a gathering

1. Open Contacts and find people by relationship or group.
2. Select one or more contacts, including people who already belong to another group.
3. Create a gathering, choose its ownership (partner A, partner B, or joint), and add candidate times and a response deadline.
4. Review the response matrix as invitees respond; identify unanswered people and follow up after the deadline.
5. Choose a time that works, verify it does not conflict with the shared calendar, then confirm and share it.
6. The gathering appears in the shared calendar and moves to Confirmed, then Completed after it takes place.

#### Invitee: respond to a request

1. Open a gathering invitation link.
2. See the hosts, fellow attendees, candidate times, and response deadline.
3. Mark each candidate as available or unavailable and submit.
4. Return later to see the confirmed time.

#### Couple: resolve a conflict

1. Open the shared calendar or Overview.
2. See an overlap between a newly confirmed or proposed gathering and an existing commitment.
3. Open the affected gathering, return to candidate selection when needed, and select a non-conflicting option.

### Product Map

#### Object Model

`Couple workspace -> Contact -> Gathering -> Candidate time -> Invitee response -> Confirmed schedule`

One contact can belong to multiple gatherings. One gathering has a lifecycle of Draft, Awaiting responses, Ready to confirm, Confirmed, and Completed. The gathering detail is the persistent home base for that lifecycle.

| Screen | User goal | Primary action | Key state variations |
| --- | --- | --- | --- |
| Home | Identify the most urgent next task across all gatherings | Contextual: Create gathering, Check unanswered invitees, or Share schedule | Empty workspace, waiting response, ready to confirm, upcoming confirmed event |
| Gatherings list | Browse all gatherings without opening each one | Open a gathering requiring attention | Draft, waiting, ready, confirmed, completed; search and status filter later |
| Gathering detail | Return to one gathering and understand its state, people, dates, and next step | Contextual: Continue setup, Send reminder, Review times, or Share schedule | Every lifecycle state; conflict and overdue response surfaced inline |
| Contact selection | Form the attendee set for a new gathering | Continue to date setup | Empty search, selected people, multi-group membership |
| Candidate setup | Configure candidate times and response deadline | Send time request | No candidate, selected candidates, deadline change |
| Decision review | Compare responses and choose a safe final time | Confirm schedule | Missing responses, best candidate, conflict warning, no viable candidate |
| Shared calendar | See timing conflicts across both partners | Resolve conflict | No conflict, proposed-time conflict, confirmed-time conflict |
| Invitee response | Submit availability from an invitation link | Submit response | Before deadline, after deadline, already submitted |
| Invitee confirmation | Understand the submitted response or final outcome | View confirmed schedule | Response saved, gathering confirmed |

### Required Prototype States

- A contact belonging to two groups must show both memberships without becoming two separate records.
- A gathering with at least one overdue, unanswered invitee must make the follow-up action visible.
- A candidate or confirmed time that overlaps another commitment must show a conflict warning.
- Include one 1:1 gathering, one 3 to 6 person gathering, and one joint gathering.
- Include each gathering status: Awaiting responses, Ready to confirm, Confirmed, and Completed.

## 4. Design Strategy

### Product Principles

- Reduce coordination anxiety: emphasize what needs action now, not every possible detail.
- Keep one decisive action visible per mobile screen. A person should understand the current task and the next action without navigating elsewhere.
- Reserve the primary color for the decisive CTA and explicit selected state. Use secondary and semantic colors for surfaces, metadata, routine controls, and status information.
- Preserve relationship context: relationship and owner tags should make contacts recognizable without turning the service into a generic CRM.
- Make shared ownership obvious: neither partner should need to infer whether a plan affects both people.
- Prefer clear operational states over decorative wedding imagery: this is a planning tool used repeatedly under time pressure.
- Make the invitee task lightweight: availability response should be understandable without onboarding.

### Reference Analysis To Validate During Design

| Reference type | What to study | What to adopt |
| --- | --- | --- |
| Calendar products | Fast scanning of dates, busy periods, and collisions | Dense but legible date overview and clear conflict emphasis |
| Polling and scheduling products | Comparing multiple people's availability | Candidate-by-person response matrix and decisive summary state |
| Shared planning products | Ownership, activity, and handoff between collaborators | Shared visibility and partner labels without duplicated views |
| Event invitation products | Friendly, low-friction guest participation | Focused response page and warm but restrained event context |

### GUI Direction And Rationale

#### Tone And Manner

- Calm, warm, and organized rather than ceremonial or overly romantic.
- Editorially clear typography with a practical scheduling structure.
- A restrained neutral base with distinct semantic colors for pending response, deadline risk, confirmed state, and schedule conflict.
- Familiar calendar, list, filter, and status patterns, refined with relationship labels and small invitation-specific cues.

#### Why This Direction

The product is used during a personal milestone, but the recurring task is operational coordination. An overly festive visual language can obscure statuses and conflicts; a purely corporate tool can feel detached from relationship context. The interface should balance emotional warmth with high scanability when the couple is coordinating dozens of people under a deadline.

## 5. Implementation And Figma Data Checks

### Prototype Assumptions

- The prototype uses seeded data, not a live contact list or messaging integration.
- The entire product is mobile-first. Organizer views use progressive disclosure, bottom sheets, filters, and focused detail screens so large contact lists and response matrices remain manageable on a phone.
- The invitee response view is a shorter mobile flow reached from a message link.
- Couple members have shared access to the same workspace. Detailed permissions, authentication, and notification delivery are out of scope for v1.

### Design-System Requirements

- Use reusable components for status badges, contact rows, avatar groups, date-candidate cards, filters, tabs, and buttons.
- Use variants for status and interaction states. At minimum, account for default, selected, disabled, overdue, empty, and conflict states where applicable.
- Use named color and type styles, a consistent spacing grid, semantic layer names, and Auto Layout.
- Ensure contrast is suitable for normal text and state information. Do not use color alone to signal a conflict or response state.

### Out Of Scope For The First Result

- Real SMS, KakaoTalk, email, or push delivery
- Account creation and detailed permissions
- Automatic group or time recommendations
- External calendar synchronization
- Payment, invitation design, or wedding logistics beyond invitation gatherings

## 6. First Figma Deliverable

Create a connected prototype with these frames:

1. Existing-gathering home with an upcoming deadline and a visible unanswered-invitee CTA.
2. Empty home whose only primary CTA is Create a new gathering.
3. Contact selection showing multi-group membership.
4. Candidate date selection with a response deadline.
5. Invitee mobile response view.
6. Organizer response-tracking view with unanswered invitees.
7. Shared couple calendar with a visible collision.
8. Confirmed-gathering detail with the single action Share the schedule.
9. Gatherings list for return visits and concurrent gathering management.
10. Gathering detail as the persistent home base for each gathering state.
11. Decision review comparing candidate responses before confirmation.
12. Invitee response-submitted confirmation.

The primary prototype path is: `Overview -> Contacts -> Create gathering -> Poll -> Confirm -> Calendar`.
