import type { ReactNode } from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

// ─── Topic data ──────────────────────────────────────────────────────────────
const TOPICS = [
  {
    num: '01',
    icon: '🔬',
    iconBg: 'rgba(0,229,255,0.08)',
    iconBorder: 'rgba(0,229,255,0.2)',
    title: 'Why AI QA is Broken',
    desc: 'The accountability gap between deterministic QA and the probabilistic reality of LLM systems — and why traditional test suites miss the most important failures.',
    href: '/docs/why-ai-qa-is-broken',
    tags: ['Foundations', 'Mental Model'],
    tagColor: 'rgba(0,229,255,0.08)',
    tagTextColor: '#00e5ff',
  },
  {
    num: '02',
    icon: '⚙️',
    iconBg: 'rgba(124,77,255,0.08)',
    iconBorder: 'rgba(124,77,255,0.2)',
    title: '6 Pillars of AI QA Testing',
    desc: 'Complete taxonomy: functional, accuracy & quality, robustness, performance, safety & compliance, and regression testing — with runnable code for each pillar.',
    href: '/docs/six-pillars',
    tags: ['Testing', 'Coverage'],
    tagColor: 'rgba(124,77,255,0.08)',
    tagTextColor: '#7c4dff',
  },
  {
    num: '03',
    icon: '🛡️',
    iconBg: 'rgba(0,230,118,0.08)',
    iconBorder: 'rgba(0,230,118,0.2)',
    title: 'Defense-in-Depth Architecture',
    desc: 'Layered trust controls: NIST AI RMF governance, pre-production evaluation gates, runtime guardrails, and the 7 trust vectors every AI system must satisfy.',
    href: '/docs/defense-in-depth',
    tags: ['Architecture', 'Governance'],
    tagColor: 'rgba(0,230,118,0.08)',
    tagTextColor: '#00e676',
  },
  {
    num: '04',
    icon: '🔴',
    iconBg: 'rgba(255,64,129,0.08)',
    iconBorder: 'rgba(255,64,129,0.2)',
    title: 'Real-World Attacks on LLM Systems',
    desc: 'Prompt injection, indirect injection, jailbreaks, tool abuse, data exfiltration — how attackers chain vulnerabilities and how to test your defenses systematically.',
    href: '/docs/real-world-attacks',
    tags: ['Security', 'Red Team'],
    tagColor: 'rgba(255,64,129,0.08)',
    tagTextColor: '#ff4081',
  },
  {
    num: '05',
    icon: '📊',
    iconBg: 'rgba(255,171,64,0.08)',
    iconBorder: 'rgba(255,171,64,0.2)',
    title: 'RAG Evaluation & Scoring',
    desc: 'The RAG Triad (context relevance, groundedness, answer relevance), weighted scoring models, failure mode taxonomy, and production quality monitoring.',
    href: '/docs/rag-evaluation-and-scoring',
    tags: ['RAG', 'Evaluation'],
    tagColor: 'rgba(255,171,64,0.08)',
    tagTextColor: '#ffab40',
  },
  {
    num: '06',
    icon: '📡',
    iconBg: 'rgba(0,229,255,0.08)',
    iconBorder: 'rgba(0,229,255,0.2)',
    title: 'Live Observability',
    desc: 'Session/trace/span telemetry with OpenTelemetry, LangSmith, and Phoenix. Quality metrics in production, drift detection, alerting strategy, and replay testing.',
    href: '/docs/live-observability',
    tags: ['Observability', 'Production'],
    tagColor: 'rgba(0,229,255,0.08)',
    tagTextColor: '#00e5ff',
  },
  {
    num: '07',
    icon: '🎯',
    iconBg: 'rgba(124,77,255,0.08)',
    iconBorder: 'rgba(124,77,255,0.2)',
    title: 'Advanced A/B Testing',
    desc: 'Beyond static splits — Thompson sampling, LinUCB contextual bandits, AI-specific experiment metrics, safety floors, and kill switches for harmful behavior spikes.',
    href: '/docs/advanced-ab-testing',
    tags: ['Experimentation', 'Optimization'],
    tagColor: 'rgba(124,77,255,0.08)',
    tagTextColor: '#7c4dff',
  },
  {
    num: '08',
    icon: '🔁',
    iconBg: 'rgba(0,230,118,0.08)',
    iconBorder: 'rgba(0,230,118,0.2)',
    title: 'Continuous Reliability Loop',
    desc: 'The closed-loop system connecting evals, observability, red teaming, and governance. Canary deployment patterns, SLO-based gates, and weekly operational rituals.',
    href: '/docs/continuous-reliability-loop',
    tags: ['Reliability', 'Operations'],
    tagColor: 'rgba(0,230,118,0.08)',
    tagTextColor: '#00e676',
  },
  {
    num: '09',
    icon: '🛠️',
    iconBg: 'rgba(255,64,129,0.08)',
    iconBorder: 'rgba(255,64,129,0.2)',
    title: 'Tools & Practical Implementation',
    desc: 'Full stack: DeepEval, RAGAS, LangSmith, Arize Phoenix, Garak, PyRIT, NeMo Guardrails, GrowthBook. Complete GitHub Actions CI pipeline and 30-day setup roadmap.',
    href: '/docs/tools-and-practical-implementation',
    tags: ['Tooling', 'CI/CD'],
    tagColor: 'rgba(255,64,129,0.08)',
    tagTextColor: '#ff4081',
  },
  {
    num: '10',
    icon: '✅',
    iconBg: 'rgba(255,171,64,0.08)',
    iconBorder: 'rgba(255,171,64,0.2)',
    title: 'Key Takeaways',
    desc: '10 core principles, the quality/cost/latency triangle, anti-patterns to avoid, a full implementation checklist, and your actionable 30-day path to production-ready AI QA.',
    href: '/docs/key-takeaways',
    tags: ['Summary', 'Checklist'],
    tagColor: 'rgba(255,171,64,0.08)',
    tagTextColor: '#ffab40',
  },
];

const PILLARS = [
  { num: '1', name: 'Functional', desc: 'Format, tools, edge cases' },
  { num: '2', name: 'Accuracy & Quality', desc: 'Golden datasets, LLM judges' },
  { num: '3', name: 'Robustness', desc: 'Injection, jailbreak, OOD' },
  { num: '4', name: 'Performance', desc: 'Latency, throughput, cost' },
  { num: '5', name: 'Safety & Compliance', desc: 'Toxicity, bias, privacy' },
  { num: '6', name: 'Regression', desc: 'Baseline diffs, drift detection' },
];

// ─── Hero ────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <header className={styles.heroBanner}>
      <div className={styles.scanLine} />
      <div className={styles.heroInner}>
        <div className={styles.heroBadge}>
          <span className={styles.heroBadgeDot} />
          TestMu Offline · Ahmedabad · April 2026
        </div>

        <h1 className={styles.heroTitle}>
          QA Guide for{' '}
          <span className={styles.heroTitleGradient}>AI Products</span>
        </h1>

        <p className={styles.heroSubtitle}>
          A practical engineering cookbook — from risk frameworks and adversarial
          testing to live observability and continuous reliability loops.
        </p>

        <p className={styles.heroPresentedBy}>
          By <strong>Ashish Patel</strong> · Senior Principal AI Architect @ Oracle
        </p>

        <div className={styles.heroButtons}>
          <Link className={styles.btnPrimary} to="/docs/overview">
            Start Reading →
          </Link>
          <Link
            className={styles.btnSecondary}
            href="https://github.com/ashishpatel26/QA-For-AI-Product"
          >
            ★ GitHub
          </Link>
        </div>

        <div className={styles.statsBar}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>10</span>
            <span className={styles.statLabel}>Deep Chapters</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>6</span>
            <span className={styles.statLabel}>QA Pillars</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>50+</span>
            <span className={styles.statLabel}>Code Examples</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>∞</span>
            <span className={styles.statLabel}>Production-Ready</span>
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── Topics Grid ─────────────────────────────────────────────────────────────
function TopicsSection() {
  return (
    <section className={`${styles.section} ${styles.sectionDark}`}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Reading Path</span>
          <h2 className={styles.sectionTitle}>10 Chapters, One Complete System</h2>
          <p className={styles.sectionDesc}>
            Each chapter builds on the last — from first principles to a
            production-grade reliability loop you can deploy this week.
          </p>
        </div>

        <div className={styles.topicGrid}>
          {TOPICS.map((t) => (
            <Link key={t.num} to={t.href} className={styles.topicCard}>
              <div className={styles.topicCardTop}>
                <div
                  className={styles.topicIcon}
                  style={{ background: t.iconBg, borderColor: t.iconBorder }}
                >
                  {t.icon}
                </div>
                <span className={styles.topicNumber}>§{t.num}</span>
              </div>

              <h3 className={styles.topicTitle}>{t.title}</h3>
              <p className={styles.topicDesc}>{t.desc}</p>

              <div className={styles.topicFooter}>
                <div className={styles.topicTags}>
                  {t.tags.map((tag) => (
                    <span
                      key={tag}
                      className={styles.topicTag}
                      style={{
                        background: t.tagColor,
                        color: t.tagTextColor,
                        border: `1px solid ${t.tagColor}`,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <span className={styles.topicArrow}>→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── 6 Pillars ───────────────────────────────────────────────────────────────
function PillarsSection() {
  return (
    <section className={`${styles.section} ${styles.sectionLight}`}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Framework</span>
          <h2 className={styles.sectionTitle}>The 6 Pillars of AI QA</h2>
          <p className={styles.sectionDesc}>
            Every dimension of quality must be tested. Missing even one pillar
            creates a blind spot that attackers or edge cases will find first.
          </p>
        </div>

        <div className={styles.pillarGrid}>
          {PILLARS.map((p) => (
            <div key={p.num} className={styles.pillarCard}>
              <div className={styles.pillarNumber}>{p.num}</div>
              <p className={styles.pillarName}>{p.name}</p>
              <p className={styles.pillarDesc}>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <section className={styles.ctaSection}>
      <h2 className={styles.ctaTitle}>Ready to ship trustworthy AI?</h2>
      <p className={styles.ctaSubtitle}>
        Start with the overview and follow the reading path — or jump straight
        to the chapter most relevant to your current challenge.
      </p>
      <div className={styles.ctaButtons}>
        <Link className={styles.btnPrimary} to="/docs/overview">
          Open the Cookbook →
        </Link>
        <Link className={styles.btnSecondary} to="/docs/tools-and-practical-implementation">
          Tools & Setup Guide
        </Link>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title="QA Guide for AI Products"
      description="A practical engineering cookbook — risk frameworks, adversarial testing, RAG evaluation, live observability, and continuous reliability loops for production LLM systems."
    >
      <Hero />
      <main>
        <TopicsSection />
        <PillarsSection />
        <CTASection />
      </main>
    </Layout>
  );
}
