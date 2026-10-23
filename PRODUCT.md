# Mypetravel: product notes

How I think about this product: the problem, the decisions, what I left out, and how I'd know it works. The engineering side is in the [README](README.md).

## The problem

Moving abroad with a pet isn't a checklist, it's a schedule. I learned it relocating with my dog, Jax. For a dog going from South Africa to the EU, the rabies vaccine has to come after the microchip, the blood test at least 30 days after the vaccine, then a 3 month wait, and the health certificate within 10 days of the flight. Miss one window and you start again, sometimes months later.

The information exists, but it's spread across government sites, vets and airlines, and none of it tells *you* what to do *this week*.

## Who it's for

People relocating internationally with a dog or cat, usually for the first time, often months ahead, and anxious about getting it wrong.

## Key decisions

| Decision | Why | What I said no to |
|---|---|---|
| A dated plan instead of a checklist | The risk is timing, not forgetting a task. Every task gets a real date window from your travel date | A static to do list |
| Requirements live in versioned JSON rulesets, not in code | Rules change and differ by country. Updating a ruleset doesn't need an app release | Hard coding the rules |
| Country rules extend a base ruleset | Finland and Malta add a tapeworm treatment on top of the EU rules instead of copying them | One file per country |
| Every task explains why it exists and which document proves it | People follow rules better when they understand the consequence | Bare instructions |
| Ask Claude, already knowing your pet, route and date | Questions are specific ("which vet in Cape Town?") and context makes answers useful | A generic chatbot |
| The AI key lives on a server, behind login | Keys in a web app's code can be copied by anyone | Calling the AI from the browser |
| One codebase for iOS, Android and web | One person building it; the web version comes first | Separate native apps |

## What I deliberately left out

* **More routes:** only South Africa to the EU for dogs for now. Doing one route properly beats ten routes done badly.
* **Booking vets or flights:** the app tells you what to book and when, not where.
* **Payments or premium features:** not until the core plan is proven.

## Known gaps

* The minimum lead time warning ("you need at least 5 months") exists in the rules engine but isn't shown in the app yet. It should be the first thing a late planner sees.

## How I'd know it works

* Tasks completed on time versus overdue: is the plan actually followed?
* Time from sign up to first completed task: does the first session lead to action?
* Ask Claude questions per trip, and their topics: where the plan itself isn't clear enough.
* Most importantly: did the pet travel on the planned date?
