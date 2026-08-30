---
title: "Preparing for the Age of Self-Improving AI"
description: "We are moving from an era where humans primarily improve AI toward one where AI increasingly participates in the process of improving itself. The question is no longer whether your organization is learning how to use AI. The question is whether you are building an organization capable of learning with it."
pubDate: "Aug 30 2026"
heroImage: "/blog/preparing-for-self-improving-ai.jpg"
---

For the past several years, the conversation around artificial intelligence has largely focused on capability and adoption. We have watched models become better at reasoning, writing, coding, research and increasingly complex knowledge work. At the same time, organizations have been trying to determine how to introduce these capabilities responsibly into everyday work. The questions have been familiar: How do we build AI fluency? Where should we use Copilots? Which workflows should we automate? Where do agents fit? How should we govern all of this?

There is another shift beginning underneath that conversation that I believe deserves much more attention. We are moving from an era where humans primarily improve AI toward one where AI increasingly participates in the process of improving AI. This does not mean that we have suddenly arrived at some science fiction version of artificial intelligence capable of autonomously making itself infinitely more intelligent. The reality is much more nuanced. What is happening is that individual parts of the learning and improvement cycle are becoming increasingly automated, and that could have profound implications for how organizations think about AI maturity.

To understand why, it helps to look at how we arrived here.

Until recently, the development of AI followed a relatively clear learning cycle. Researchers assembled enormous amounts of data and trained models to identify patterns within that information. With large language models, much of that initial learning came from repeatedly predicting what should come next across extraordinary volumes of text, code and other information. Humans then played another important role through post training, evaluation, reinforcement learning and feedback. We showed models examples of desirable behaviour, compared responses, identified weaknesses, established safety boundaries and continued refining the system.

The important point is that humans largely constructed the learning environment. Humans selected the objectives, designed the evaluations, interpreted the results and decided what needed to change. Models became increasingly capable, but much of that improvement happened through distinct training cycles. A model was trained, evaluated and deployed. Researchers learned from its limitations and eventually produced another, more capable generation.

In many ways, AI learned in batches.

The models we interact with today do not typically retrain their underlying foundation model after every conversation. Millions of interactions may ultimately contribute signals that inform future improvements, but those improvements generally happen through a broader development and training process. Intelligence improves, but the improvement cycle remains largely separated from the moment when the work itself occurs.

What is beginning to change is the distance between those two moments.

## The Shrinking Learning Loop

AI systems are increasingly capable of generating an output, evaluating that output, identifying weaknesses, trying another approach, testing the result and retaining what worked. Coding agents provide an accessible example. An agent can write code, execute it, observe an error, reason about what went wrong, modify the code and try again. The system is no longer simply producing an answer. It is participating in a feedback loop.

We are seeing increasingly sophisticated versions of this idea in AI research. Self play allows AI systems to generate challenges for other AI systems. Synthetic data allows models to contribute to the creation of training material. Automated evaluation allows enormous numbers of potential solutions to be tested without requiring humans to manually review each one. AI systems are also beginning to participate directly in scientific and AI research.

Google DeepMind's AlphaEvolve provides an interesting example of where this is heading. The system combines large language models with automated evaluators and evolutionary techniques to generate potential algorithms, evaluate them, retain promising approaches and continue searching for better solutions. Google has reported applying discoveries from this approach to its computing infrastructure and even to aspects of the systems used to train AI.

Research such as the Darwin Gödel Machine explores an even more provocative idea: agents that can modify parts of their own code, evaluate whether those modifications improve performance and retain successful changes. These systems remain experimental and highly constrained, but they illustrate an important direction of travel. AI is beginning to participate in the machinery through which AI itself improves.

We should be careful not to overstate what this means. There is a significant difference between a system improving its answer, an agent optimizing a workflow and genuine recursive self improvement where a system repeatedly improves its own ability to improve. The latter remains a research frontier surrounded by significant technical, safety and evaluation challenges.

But organizations do not need to wait for full recursive self improvement before this transition becomes important.

## Organizations Also Learn in Batches

The more immediate development is that the learning loop itself is becoming smaller. AI can increasingly act, observe, evaluate, modify and try again. And once I started thinking about AI through that lens, I noticed an interesting parallel with how organizations operate.

Most organizations still learn in batches too.

We execute work, collect information, build dashboards, hold operating reviews, analyze performance, identify problems and eventually decide what should change. Processes are updated, employees are trained and the organization begins another cycle. Some companies perform this extremely well, but the fundamental architecture remains largely the same. Work happens first. Organizational learning happens afterwards.

Historically, this has been sufficient because the environment around the organization changed at a pace that management systems could reasonably absorb. But AI introduces the possibility of something different: systems capable of continuously observing the work itself and turning outcomes into learning.

Consider what this could mean in healthcare technology.

A typical implementation produces enormous amounts of information. Discovery conversations reveal customer requirements. Configuration decisions determine how workflows will operate. Data migration exposes patterns within existing systems. Integrations create another set of dependencies. Training reveals where users struggle. Go live creates adoption signals. Support cases expose issues that were not apparent during implementation.

Today, those signals frequently exist across different teams, systems and moments in the customer lifecycle. An implementation consultant may learn something that never reaches Support. Support may identify a recurring issue that never changes the original implementation methodology. Customer Success may observe an adoption pattern that does not immediately influence configuration. Product may eventually receive the signal, but often after considerable time has passed.

Now imagine that lifecycle as a learning system.

Suppose AI observes that customers using a particular configuration pattern consistently experience a certain category of support issue after go live. The system examines previous implementations, compares configurations where the issue occurred against those where it did not, and identifies a potential relationship. It proposes a different configuration approach and presents the evidence to a domain expert. The expert validates the recommendation, the new pattern becomes part of the organization's implementation knowledge, and future implementations inherit that learning.

The important innovation is not simply that AI automated a task. The implementation process itself became capable of learning.

## A Framework for AI Maturity

This is where I believe the conversation about AI maturity needs to evolve. An organization experimenting with ChatGPT or Copilot has very different requirements from one deploying autonomous agents, and an organization deploying agents has very different requirements from one allowing AI to recommend changes to the workflows those agents execute.

At the earliest level of maturity, AI fluency remains the priority. Employees need to understand what AI can and cannot do, how to evaluate its output and how to integrate it responsibly into their work. The central question is whether people can work effectively with AI.

As organizations become more AI enabled, AI becomes embedded into everyday workflows. Research, documentation, analysis, development and customer communication increasingly involve AI. At this stage, feedback becomes critical. It is not enough to know that employees are using AI. Organizations need to understand whether AI actually improved the outcome. Without that signal, usage becomes a poor substitute for value.

The transition toward agentic AI raises the bar again. Once AI begins performing work rather than simply assisting with it, organizations require stronger capabilities around identity, permissions, observability, memory, auditability, evaluation and human escalation. The question moves from whether employees can use AI to whether the organization can trust AI to execute work within defined boundaries.

The next stage may be what I think of as the **Adaptive Enterprise**. Here, AI is not only performing the workflow. It is helping the organization determine whether the workflow itself can be improved. Outcomes become signals. Signals become learning. Validated learning changes future behaviour.

Eventually, the most mature organizations may begin operating as genuinely self improving enterprises, where intelligence is continuously moving through a cycle of action, outcome, evaluation and adaptation. Humans remain central to the process, but increasingly at the level of intent, governance and judgment rather than manually designing every individual improvement.

## The Evaluation Problem

This introduces one of the most important challenges in the entire idea of Self Improving AI.

A system cannot meaningfully improve unless it knows what better means.

Consider something as familiar as customer support. If we ask AI to improve support operations, what exactly should it optimize? Case closure time, customer satisfaction, cost, first contact resolution, employee productivity or customer outcomes? A system could become exceptionally good at closing cases quickly while becoming worse at solving the underlying problems customers actually care about.

Healthcare makes the consequences even more significant. Optimizing a clinical workflow for efficiency could remove friction, but some friction exists for a reason. A seemingly unnecessary step might represent an important clinical safeguard. Optimizing one measurable outcome without understanding the broader system can create unintended consequences elsewhere.

This is why I believe evaluation will become one of the defining capabilities of the next generation of AI organizations.

We have spent considerable time learning how to prompt AI. The next challenge is learning how to evaluate AI at scale. Organizations will need to become much more precise about what constitutes a successful outcome, which tradeoffs are acceptable, which signals matter and where human judgment must remain involved.

Before we build systems capable of improving themselves, we need systems capable of knowing what better means.

And that is ultimately not a technology question. It is a leadership question.

## Designing a Learning Architecture

This also changes how I think about AI architecture. Most AI strategies today understandably focus on models, platforms, Copilots, agents and use cases. Those decisions matter, but increasingly I think organizations will also need to design something broader: their learning architecture.

A learning architecture connects several capabilities that organizations often treat separately. AI needs context so it understands what the organization knows. It needs memory so valuable learning persists. It needs feedback connecting actions with real world outcomes. It needs evaluation to determine whether those outcomes were desirable. And it needs governance to determine which improvements should be accepted and propagated.

When those capabilities connect, a continuous loop begins to emerge. Context informs an action. The action creates an outcome. The outcome generates a signal. The signal is evaluated. Evaluation creates learning. Validated learning improves the next action.

The faster an organization can safely move through that loop, the faster the organization can learn.

## Intelligence That Compounds

I think this has significant implications for what it means to become AI First.

Being AI First cannot simply mean giving employees access to AI or measuring how frequently Copilot is used. It cannot simply mean deploying agents across the organization. Those are important milestones, but they are not the destination.

The more interesting opportunity is to build an organization where intelligence compounds.

Over time, access to highly capable foundation models will become increasingly common. Most organizations will be able to access similar levels of underlying intelligence. The differentiator will increasingly become everything surrounding the model: proprietary context, organizational knowledge, quality of feedback, evaluation systems, governance, and the speed at which learning can be translated into better decisions and better workflows.

The organization that learns something important from one customer and makes that knowledge available to every future customer has an advantage. The organization that identifies a recurring implementation issue and eliminates it from every subsequent implementation has an advantage. The organization that can connect signals across implementation, support, customer success and product and turn them into continuous improvement has an advantage.

This is where Self Improving AI becomes much more than a conversation about increasingly capable models.

It becomes a conversation about increasingly capable organizations.

## Leadership's Role Becomes More Important, Not Less

And leadership's role becomes even more important.

As AI becomes capable of determining more of the path, leaders need to become increasingly precise about the destination. What outcome are we trying to create? What boundaries cannot be crossed? What values must be preserved? What risks are acceptable? Where must humans remain involved? What tradeoffs are we willing to make?

Most importantly, what does better mean?

AI may increasingly help optimize the path. Leadership still needs to define the destination.

The first phase of Generative AI gave organizations access to intelligence. The next phase began embedding that intelligence into everyday work. Agentic AI is beginning to allow organizations to delegate increasingly complex work. Self Improving AI introduces another possibility: the ability for intelligence and learning to compound.

An AI improves an answer. That learning improves how a task is performed. The improved task changes a workflow. The workflow produces a better outcome. That outcome creates another signal. The signal creates another opportunity to learn.

The loop continues.

If that future develops, the most mature AI organization may not be the company with the largest number of agents, the biggest AI budget or even access to the most advanced model.

It may simply be the organization that learns the fastest.

That means leaders should begin asking different questions. Where are our learning loops? What signals are we capturing? What happens to everything we learn from our customers? How quickly does knowledge discovered by one team become available to the rest of the organization? How do we determine whether an AI generated improvement is genuinely better? How quickly can a validated improvement become part of how everyone works?

For decades, technology improved and organizations adapted to it.

We may now be entering a period where technology increasingly becomes part of the mechanism through which the organization itself learns and adapts.

That is a much bigger shift than simply deploying another AI tool.

The question is no longer whether your organization is learning how to use AI. The question is whether you are building an organization capable of learning with it.
