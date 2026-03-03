import type { CitationRef } from "./mock-research";

// ── Shared Types ────────────────────────────────────────────────────

export interface ResultTheologian {
  name: string;
  initials: string;
  dates: string;
  tradition: string;
  color: string;
}

interface ResultBase {
  id: string;
  title: string;
  team: string;
  date: string;
}

// ── Ask ─────────────────────────────────────────────────────────────

export interface AskPerspective {
  theologian: ResultTheologian;
  perspective: string;
  reaction?: string | null;
}

export interface AskResult extends ResultBase {
  tool: "ask";
  summary: string;
  perspectives: AskPerspective[];
}

// ── Poll ────────────────────────────────────────────────────────────

export interface PollOption {
  label: string;
  percentage: number;
  count: number;
}

export interface CenturyTrendEntry {
  era: string;
  options: { label: string; percentage: number }[];
}

export interface PollTheologianSelection {
  theologian: ResultTheologian;
  selection: string;
  justification: string;
}

export interface PollResult extends ResultBase {
  tool: "poll";
  summary: string;
  totalPolled: number;
  options: PollOption[];
  centuryTrend: CenturyTrendEntry[];
  theologianSelections: PollTheologianSelection[];
}

// ── Review ──────────────────────────────────────────────────────────

export interface ReviewReaction {
  theologian: ResultTheologian;
  grade: string;
  assessment: string;
  strengths: string[];
  weaknesses: string[];
}

export interface ReviewResult extends ResultBase {
  tool: "review";
  grade: string;
  summary: string;
  reactions: ReviewReaction[];
}

// ── Research ────────────────────────────────────────────────────────

export interface ResearchResult extends ResultBase {
  tool: "research";
  theologianName: string;
  responseText: string;
  citations: CitationRef[];
}

// ── Union ───────────────────────────────────────────────────────────

export type FullResult = AskResult | PollResult | ReviewResult | ResearchResult;

// ── Standard Theologian Panel ───────────────────────────────────────

const augustine: ResultTheologian = {
  name: "Augustine of Hippo",
  initials: "AH",
  dates: "354–430",
  tradition: "Patristic",
  color: "#7A2E2E",
};

const aquinas: ResultTheologian = {
  name: "Thomas Aquinas",
  initials: "TA",
  dates: "1225–1274",
  tradition: "Medieval",
  color: "#1B6B6D",
};

const calvin: ResultTheologian = {
  name: "John Calvin",
  initials: "JC",
  dates: "1509–1564",
  tradition: "Reformed",
  color: "#5A7A62",
};

const luther: ResultTheologian = {
  name: "Martin Luther",
  initials: "ML",
  dates: "1483–1546",
  tradition: "Lutheran",
  color: "#B8963E",
};

const barth: ResultTheologian = {
  name: "Karl Barth",
  initials: "KB",
  dates: "1886–1968",
  tradition: "Modern",
  color: "#6B6560",
};

// ── Mock Results ────────────────────────────────────────────────────

const results: Record<string, FullResult> = {
  "ml-1": {
    id: "ml-1",
    tool: "ask",
    title: "How did the early church understand justification?",
    team: "Church Fathers",
    date: "Feb 20, 2026",
    summary:
      "The panel identified three distinct strands of justification theology in the ante-Nicene period. Patristic and Medieval voices emphasized transformative grace — justification as an actual making-righteous through infused grace and the work of the Holy Spirit. Reformed and Lutheran voices sharply distinguished justification from sanctification, insisting on forensic declaration and imputed righteousness as the Reformation's essential correction. Barth offered a christological synthesis, locating justification as an objective reality accomplished in Christ's death and resurrection rather than merely a subjective experience. The deepest fault line runs between those who see justification as God making the sinner righteous and those who see it as God declaring the sinner righteous.",
    perspectives: [
      {
        theologian: augustine,
        perspective:
          "Justification is fundamentally a work of divine grace that transforms the sinner from within. It is not merely a legal declaration but an actual making-righteous — God pours His love into the heart through the Holy Spirit. The justified person is simultaneously healed and renewed, moving progressively toward the righteousness that God both demands and supplies. Without grace, the will remains captive to concupiscence; with grace, faith becomes active in love.",
      },
      {
        theologian: aquinas,
        perspective:
          "Justification involves four elements occurring simultaneously: the infusion of grace, the movement of free will toward God through faith, the movement of free will against sin, and the remission of guilt. It is not sequential but a single divine act perceived under different aspects. The formal cause of justification is the justice of God — not that by which He is just, but that by which He makes us just. Faith is the beginning, foundation, and root of all justification.",
      },
      {
        theologian: calvin,
        perspective:
          "Justification is a forensic act whereby God declares the sinner righteous on the basis of Christ's imputed righteousness alone. This is the principal hinge on which religion turns. It must be sharply distinguished from sanctification, though the two are inseparable in the believer's union with Christ. The early church often conflated these categories, which the Reformation rightly clarified. Sola fide means faith is the sole instrument — not the ground — of our justification.",
      },
      {
        theologian: luther,
        perspective:
          "Here I stand: justification is by faith alone, apart from works of the law. This is the article by which the church stands or falls. The righteousness that avails before God is an alien righteousness — Christ's own righteousness credited to the believer. We are simultaneously sinners and justified, simul iustus et peccator. The early church often drifted toward a theology of merit, but Paul's letter to the Romans speaks clearly: the just shall live by faith.",
      },
      {
        theologian: barth,
        perspective:
          "Justification must be understood christologically. In Christ, God has already accomplished the justification of all humanity — it is an objective reality in the history of Jesus Christ, not merely a subjective experience of the individual. The early church groped toward this truth but lacked the christological concentration needed to articulate it fully. Justification is God's verdict spoken in the resurrection: the old has passed away, the new has come.",
      },
    ],
  },

  "ml-2": {
    id: "ml-2",
    tool: "ask",
    title: "Is penal substitutionary atonement the best framework for understanding the cross?",
    team: "All Theologians",
    date: "Feb 18, 2026",
    summary:
      "The panel was sharply divided. Reformed and Lutheran voices strongly affirmed penal substitutionary atonement as central and non-negotiable — the satisfaction of divine justice through the substitutionary bearing of wrath. Patristic and Medieval voices preferred a multi-model approach: the cross as satisfaction, sacrifice, merit, redemption, and victory over the devil, with love rather than penalty as the deepest category. Barth offered a mediating position, affirming substitution as personal rather than merely penal, grounded in the doctrine of election. No consensus emerged on whether PSA is 'the best' framework, but all agreed the cross involves substitution in some form.",
    perspectives: [
      {
        theologian: augustine,
        perspective:
          "The cross is above all the supreme demonstration of God's love and humility. Christ the Mediator, being both God and man, offered Himself as a sacrifice to reconcile us to the Father. I would not reduce this mystery to a single juridical framework. The cross defeats the devil's unjust claim, heals our wounded nature, and satisfies divine justice — but the deepest truth is that love moved God to take on our mortality so we might share His immortality.",
      },
      {
        theologian: aquinas,
        perspective:
          "Christ's passion operates through multiple modes of causality: as merit, satisfaction, sacrifice, redemption, and efficient cause of salvation. Penal substitution captures part of the truth — Christ bore the punishment due to us — but it must be situated within a broader framework of satisfaction. Christ did not merely take our penalty; He offered to the Father something greater than what was required to compensate for all human sin. The superabundance of His love and obedience is the key.",
      },
      {
        theologian: calvin,
        perspective:
          "Penal substitution stands at the heart of the gospel. Christ bore in His body the penalty that the divine tribunal had pronounced against us. He was made sin who knew no sin, so that in Him we might become the righteousness of God. This is no mere moral example or dramatic victory — it is the satisfaction of divine justice through the substitutionary bearing of wrath. Other models illuminate aspects of the atonement, but without penal substitution, the cross loses its essential character.",
      },
      {
        theologian: luther,
        perspective:
          "Christ became the greatest sinner who ever lived — not in His own person, but by imputation. He took upon Himself the sin of the world and suffered the full fury of God's wrath in our place. This is the joyous exchange: our sin transferred to Him, His righteousness transferred to us. This is not one theory among many — it is the proclamation that the law's curse has been exhausted on the cross. Any theology that softens this truth guts the gospel.",
      },
      {
        theologian: barth,
        perspective:
          "The cross must be interpreted within the doctrine of election. In Jesus Christ, God elected Himself for rejection and humanity for fellowship. The Judge judged in our place — this is the revolutionary meaning of Golgotha. But I resist reducing this to a transactional exchange of penalties. The atonement is the history of God's being for us, in which the Son freely enters into the far country of human alienation. It is substitutionary, yes, but the substitution is personal, not merely penal.",
      },
    ],
  },

  "ml-4": {
    id: "ml-4",
    tool: "ask",
    title: "Can a coherent doctrine of the Trinity be articulated without the filioque clause?",
    team: "Church Fathers",
    date: "Feb 14, 2026",
    summary:
      "Eastern panelists argued persuasively that the monarchy of the Father provides sufficient trinitarian structure without the filioque, while Western voices maintained that the clause guards against subordinationism and is logically necessary to distinguish Son from Spirit. Augustine and Aquinas presented the strongest defenses of the filioque on metaphysical grounds — that without it, no real relation distinguishes the second and third persons. Calvin and Luther affirmed the filioque but with less speculative investment, grounding it primarily in Scripture. Barth proposed a creative revision — 'the Spirit proceeds from the Father of the Son' — as a possible ecumenical bridge. The panel agreed that the underlying concern (the Spirit's relation to Christ) is non-negotiable, even if the formulation remains debated.",
    perspectives: [
      {
        theologian: augustine,
        perspective:
          "The Spirit proceeds from the Father and the Son as from a single principle. This is not an innovation but the clear teaching of Scripture — the Spirit is called the Spirit of the Son as well as the Spirit of the Father. The filioque safeguards the consubstantiality of Father and Son and prevents any suggestion that the Spirit has no essential relation to the Son. Without it, the mutual relations that constitute the persons become obscured.",
      },
      {
        theologian: aquinas,
        perspective:
          "The persons of the Trinity are distinguished solely by relations of origin. If the Spirit does not proceed from the Son, there would be no real relation distinguishing Son from Spirit, and they could not be truly distinct persons. The filioque is therefore not optional but theologically necessary. The Eastern formula 'through the Son' approaches the same truth but without the metaphysical precision required by the doctrine of subsistent relations.",
      },
      {
        theologian: calvin,
        perspective:
          "The filioque controversy generated more heat than light in many respects. What matters is that Scripture attributes the sending of the Spirit to both the Father and the Son. The eternal procession mirrors the temporal mission. I am less concerned with Greek metaphysical categories than with the plain sense of John 15:26 and Galatians 4:6. The Reformed tradition affirms the filioque as consistent with biblical testimony, but we should hold our speculative theology with appropriate modesty.",
      },
      {
        theologian: luther,
        perspective:
          "I confess the Nicene Creed with the filioque and see no reason to abandon it. The Spirit proceeds from the Father and the Son — this is what the church has believed and taught. But I have little patience for the philosophical gymnastics that have made this a church-dividing issue. The Trinity is to be believed, not dissected. What concerns me is that the Spirit testifies to Christ, applies Christ's work, and creates faith. That the Spirit is the Spirit of the Son is the practical heart of the matter.",
      },
      {
        theologian: barth,
        perspective:
          "The filioque rightly preserves the christological concentration of trinitarian theology. The Spirit is the Spirit of Jesus Christ — this is not merely an economic truth but reflects the eternal life of God. However, I take the Eastern concern seriously: the monarchy of the Father must not be dissolved. A revised formula — the Spirit proceeds from the Father of the Son — might honor both traditions. The Trinity is God's freedom in love, and our formulations must serve, not replace, that living reality.",
      },
    ],
  },

  "ml-5": {
    id: "ml-5",
    tool: "poll",
    title: "Should women be ordained to pastoral ministry?",
    team: "All Theologians",
    date: "Feb 15, 2026",
    summary:
      "Opinion is closely divided, with a slim plurality in favor. The strongest support comes from modern theologians, while patristic and medieval voices overwhelmingly opposed. The century trend reveals a dramatic historical shift — opposition dominated for over a millennium before reversing sharply in the modern era. The 'Nuanced' camp, though smallest, included influential voices who distinguished between ordination in principle and particular ecclesial contexts.",
    totalPolled: 48,
    options: [
      { label: "In favor", percentage: 44, count: 21 },
      { label: "Opposed", percentage: 39, count: 19 },
      { label: "Nuanced", percentage: 17, count: 8 },
    ],
    centuryTrend: [
      {
        era: "Patristic",
        options: [
          { label: "In favor", percentage: 10 },
          { label: "Opposed", percentage: 80 },
          { label: "Nuanced", percentage: 10 },
        ],
      },
      {
        era: "Medieval",
        options: [
          { label: "In favor", percentage: 5 },
          { label: "Opposed", percentage: 85 },
          { label: "Nuanced", percentage: 10 },
        ],
      },
      {
        era: "Reformation",
        options: [
          { label: "In favor", percentage: 10 },
          { label: "Opposed", percentage: 75 },
          { label: "Nuanced", percentage: 15 },
        ],
      },
      {
        era: "Post-Reformation",
        options: [
          { label: "In favor", percentage: 30 },
          { label: "Opposed", percentage: 50 },
          { label: "Nuanced", percentage: 20 },
        ],
      },
      {
        era: "Modern",
        options: [
          { label: "In favor", percentage: 65 },
          { label: "Opposed", percentage: 20 },
          { label: "Nuanced", percentage: 15 },
        ],
      },
    ],
    theologianSelections: [
      {
        theologian: augustine,
        selection: "Opposed",
        justification:
          "The order of creation and the apostolic tradition both indicate that the pastoral office is reserved to men. The bishop stands in the place of Christ the Bridegroom, and this symbolic ordering is not arbitrary but rooted in the divine economy. Women serve the church in indispensable ways, but the presbyteral office is not among them.",
      },
      {
        theologian: aquinas,
        selection: "Opposed",
        justification:
          "The sacrament of Holy Orders requires the recipient to signify Christ in a manner that includes natural resemblance. Since Christ chose male apostles — not from cultural accommodation but by deliberate will — the matter of the sacrament cannot be altered without changing its meaning. This is not a judgment on women's dignity but on sacramental signification.",
      },
      {
        theologian: calvin,
        selection: "Nuanced",
        justification:
          "Scripture is clear that the apostolic church restricted the teaching office to men, and we must take Paul's instructions seriously. Yet I distinguish between the permanent moral law and particular ecclesiastical arrangements. The key question is whether the restriction is grounded in creation order or in apostolic prudence for a particular cultural moment. I lean toward the former but acknowledge the exegetical complexity.",
      },
      {
        theologian: luther,
        selection: "Opposed",
        justification:
          "The Office of the Ministry is established by Christ and entrusted to those He called. The pastoral office carries the authority of Word and Sacrament, and Scripture consistently places this responsibility on men. This is not about capability — many women far exceed men in faith and understanding — but about the ordering Christ Himself established.",
      },
      {
        theologian: barth,
        selection: "In favor",
        justification:
          "The freedom of God cannot be bound by human traditions masquerading as divine orders. If the Spirit gifts and calls a woman to pastoral ministry, the church has no right to refuse what God has ordained. The subordination of women in church office reflects cultural patriarchy, not the order of redemption. In Christ there is neither male nor female — and this must have ecclesiological consequences.",
      },
    ],
  },

  "ml-6": {
    id: "ml-6",
    tool: "poll",
    title: "Is infant baptism scripturally warranted?",
    team: "Reformers",
    date: "Feb 10, 2026",
    summary:
      "A clear majority affirmed infant baptism as scripturally warranted, though the margin has narrowed considerably from the medieval period to the modern era. Patristic and medieval consensus was near-universal in support. The Reformation introduced the sharpest division, with Anabaptist and Baptist voices insisting on believer's baptism alone. The modern period shows continued erosion of the paedobaptist majority, with growing evangelical and free-church influence pushing the 'No' camp to near-parity.",
    totalPolled: 32,
    options: [
      { label: "Yes", percentage: 62, count: 20 },
      { label: "No", percentage: 25, count: 8 },
      { label: "Unclear", percentage: 13, count: 4 },
    ],
    centuryTrend: [
      {
        era: "Patristic",
        options: [
          { label: "Yes", percentage: 75 },
          { label: "No", percentage: 10 },
          { label: "Unclear", percentage: 15 },
        ],
      },
      {
        era: "Medieval",
        options: [
          { label: "Yes", percentage: 90 },
          { label: "No", percentage: 5 },
          { label: "Unclear", percentage: 5 },
        ],
      },
      {
        era: "Reformation",
        options: [
          { label: "Yes", percentage: 55 },
          { label: "No", percentage: 35 },
          { label: "Unclear", percentage: 10 },
        ],
      },
      {
        era: "Post-Reformation",
        options: [
          { label: "Yes", percentage: 50 },
          { label: "No", percentage: 38 },
          { label: "Unclear", percentage: 12 },
        ],
      },
      {
        era: "Modern",
        options: [
          { label: "Yes", percentage: 45 },
          { label: "No", percentage: 40 },
          { label: "Unclear", percentage: 15 },
        ],
      },
    ],
    theologianSelections: [
      {
        theologian: augustine,
        selection: "Yes",
        justification:
          "The practice of baptizing infants has been received from the apostles. Infants, though incapable of personal faith, are born under the guilt of original sin and require the washing of regeneration. The faith of the church stands in for the infant, just as it was the faith of those who brought the paralytic that moved Christ to heal. To deny baptism to infants is to deny them the remedy for the wound they bear from Adam.",
      },
      {
        theologian: aquinas,
        selection: "Yes",
        justification:
          "Baptism is the sacrament of faith, and infants are baptized in the faith of the church. Just as children inherit original sin without personal consent, so they may receive the remedy of grace through the sacramental action of the community. The practice is attested from antiquity and rests on sound theological principle: the efficacy of the sacrament depends on Christ's institution, not the recipient's subjective disposition.",
      },
      {
        theologian: calvin,
        selection: "Yes",
        justification:
          "Infant baptism corresponds to circumcision under the old covenant. God's promise extends to believers and their children, and baptism is the sign and seal of that promise. To exclude the children of believers from the covenant sign is to make the new covenant narrower than the old — which contradicts the entire trajectory of redemptive history. The Anabaptist position, however sincere, misunderstands the nature of the covenant.",
      },
      {
        theologian: luther,
        selection: "Yes",
        justification:
          "I baptize infants because Christ commands us to baptize all nations and forbids none. God can and does work faith in infants through the Word joined to the water. The Anabaptists err grievously in making baptism depend on the individual's conscious decision — as if God's grace were conditional on our cooperation. Infant baptism is a powerful testimony that salvation is God's work, not ours.",
      },
      {
        theologian: barth,
        selection: "No",
        justification:
          "Baptism is properly the free response of a human being to God's gracious action in Jesus Christ. To baptize an unconscious infant reduces the sacrament to a mechanical rite and obscures the character of faith as a free, personal decision. The church's long practice of infant baptism has contributed to the disastrous confusion of church and civil society. Baptism should be restored to its New Testament form: the public confession of one who has heard and responded to the gospel.",
      },
    ],
  },

  "ml-7": {
    id: "ml-7",
    tool: "review",
    title: "Review of 'Mere Christianity' Chapter 3 argument",
    team: "Reformers",
    date: "Feb 12, 2026",
    grade: "B+",
    summary:
      "Lewis's moral argument is rhetorically compelling and philosophically accessible, but the panel noted gaps in scriptural grounding and an over-reliance on natural-law reasoning that some traditions would question. The argument succeeds as apologetics but would need theological deepening for systematic use.",
    reactions: [
      {
        theologian: augustine,
        grade: "B+",
        assessment:
          "Lewis's appeal to a universal moral law resonates with the lex aeterna written on the human heart. His argument from conscience echoes what I have called the interior teacher. However, he underestimates the noetic effects of sin — fallen humanity does not simply 'know' the moral law but suppresses it. The argument needs a stronger doctrine of illumination.",
        strengths: [
          "Effective appeal to universal moral intuition",
          "Accessible language for non-specialists",
          "Sound basic structure moving from morality to a moral Lawgiver",
        ],
        weaknesses: [
          "Insufficient account of sin's corruption of moral knowledge",
          "Lacks christological grounding for the moral law",
        ],
      },
      {
        theologian: aquinas,
        grade: "A-",
        assessment:
          "The chapter presents a recognizable form of natural-law reasoning, and I commend Lewis for making it accessible. His movement from moral experience to a transcendent Lawgiver follows a valid line of argumentation. However, the treatment lacks the precision of distinguishing between synderesis, natural law, and positive law. The argument would benefit from greater metaphysical rigor.",
        strengths: [
          "Valid natural-law framework presented clearly",
          "Correct identification of moral obligation as pointing beyond itself",
          "Good use of common human experience as starting point",
        ],
        weaknesses: [
          "Lacks distinction between different levels of law",
          "Moral realism asserted rather than demonstrated",
          "Does not address the analogical nature of moral predication",
        ],
      },
      {
        theologian: calvin,
        grade: "B",
        assessment:
          "Lewis writes with admirable clarity and persuasive force. Yet his reliance on natural moral knowledge, while useful for apologetics, risks implying that unregenerate reason can arrive at saving truth. The sensus divinitatis gives humans an awareness of God, but this awareness condemns rather than saves apart from the Word and Spirit. Lewis's argument is a useful prolegomenon but not a substitute for revealed theology.",
        strengths: [
          "Powerful rhetorical engagement with secular readers",
          "Correctly identifies the inadequacy of materialism",
        ],
        weaknesses: [
          "Over-reliance on natural theology at the expense of revealed truth",
          "Does not adequately distinguish general from special revelation",
          "Moral argument alone cannot establish the Christian God specifically",
        ],
      },
      {
        theologian: luther,
        grade: "B-",
        assessment:
          "Lewis is a gifted writer, and his argument has brought many to consider Christianity. But philosophy is the devil's whore when it pretends to establish what only faith can grasp. The law written on the heart serves to accuse, not to save. Lewis's moral argument may prepare the ground, but it must not be mistaken for the gospel itself. Where is the cross in this chapter? Where is the proclamation of Christ crucified?",
        strengths: [
          "Engaging prose that reaches ordinary readers",
          "Correctly shows that morality points beyond itself",
        ],
        weaknesses: [
          "Philosophy elevated above proclamation of the gospel",
          "The law's primary function (accusation) is underemphasized",
          "No mention of justification by faith or the theology of the cross",
        ],
      },
      {
        theologian: barth,
        grade: "C+",
        assessment:
          "Lewis's project of establishing a moral foundation for Christianity through general experience is methodologically problematic. Theology does not begin from below — from human moral consciousness — but from above, from God's self-revelation in Jesus Christ. The moral argument, however skillfully presented, belongs to the tradition of natural theology that I have critiqued at length. Christianity is not the best explanation for morality; it is the announcement of God's gracious action in history.",
        strengths: [
          "Demonstrates genuine concern for communicating with non-believers",
          "Identifies real features of human moral experience",
        ],
        weaknesses: [
          "Begins from human experience rather than divine revelation",
          "Natural theology cannot establish the God of Abraham, Isaac, and Jacob",
          "Risks reducing Christianity to the best available moral philosophy",
        ],
      },
    ],
  },

  "ml-9": {
    id: "ml-9",
    tool: "research",
    title: "What does Aquinas say about the natural law and eternal law?",
    team: "Thomas Aquinas",
    date: "Feb 19, 2026",
    theologianName: "Thomas Aquinas",
    responseText:
      'Aquinas teaches that the natural law is nothing other than the rational creature\'s participation in the eternal law [1]. The eternal law is the divine reason\'s governance of all creation — it is the exemplar of divine wisdom as directing all actions and movements [2]. Since human beings are rational, they participate in divine providence in a unique way: not merely by being governed, but by governing themselves and others through the natural inclinations of reason.\n\nThe first precept of natural law is that good is to be done and pursued, and evil is to be avoided. All other precepts are founded upon this [3]. From this foundational principle, Aquinas derives secondary precepts corresponding to the natural inclinations of human nature: the preservation of life, the procreation and education of offspring, and the pursuit of truth and life in society.\n\nCritically, Aquinas argues that the natural law is immutable in its primary precepts but can admit of change in its secondary precepts by way of addition [4]. The Decalogue contains precepts of the natural law, and human law derives its force from the natural law insofar as it is a particular determination of what the natural law requires in concrete circumstances [5].',
    citations: [
      {
        id: "r9-c1",
        marker: "1",
        source: "Summa Theologiae I-II, q. 91, a. 2, co.",
        originalText:
          "Unde patet quod lex naturalis nihil aliud est quam participatio legis aeternae in rationali creatura.",
        translation:
          "Hence it is clear that the natural law is nothing other than the participation of the eternal law in the rational creature.",
      },
      {
        id: "r9-c2",
        marker: "2",
        source: "Summa Theologiae I-II, q. 93, a. 1, co.",
        originalText:
          "Lex aeterna nihil aliud est quam ratio divinae sapientiae, secundum quod est directiva omnium actuum et motionum.",
        translation:
          "The eternal law is nothing other than the plan of divine wisdom, insofar as it directs all actions and movements.",
      },
      {
        id: "r9-c3",
        marker: "3",
        source: "Summa Theologiae I-II, q. 94, a. 2, co.",
        originalText:
          "Hoc est ergo primum praeceptum legis, quod bonum est faciendum et prosequendum, et malum vitandum.",
        translation:
          "This therefore is the first precept of the law: that good is to be done and pursued, and evil is to be avoided.",
      },
      {
        id: "r9-c4",
        marker: "4",
        source: "Summa Theologiae I-II, q. 94, a. 5, co.",
        originalText:
          "Quantum ad prima principia legis naturae, lex naturae est omnino immutabilis. Quantum autem ad secunda praecepta... lex naturalis mutari potest per modum additionis.",
        translation:
          "As regards the first principles of the natural law, the natural law is altogether immutable. But as to the secondary precepts... the natural law can be changed by way of addition.",
      },
      {
        id: "r9-c5",
        marker: "5",
        source: "Summa Theologiae I-II, q. 95, a. 2, co.",
        originalText:
          "Omnis lex humanitus posita intantum habet de ratione legis, inquantum a lege naturae derivatur.",
        translation:
          "Every human law has the character of law insofar as it is derived from the natural law.",
      },
    ],
  },

  "ml-10": {
    id: "ml-10",
    tool: "research",
    title: "How does Aquinas distinguish the analogy of proportionality from attribution?",
    team: "Thomas Aquinas",
    date: "Feb 16, 2026",
    theologianName: "Thomas Aquinas",
    responseText:
      'Aquinas holds that when we predicate terms like "good" or "wise" of both God and creatures, we do so neither univocally nor equivocally, but analogically. In the analogy of attribution, a term is predicated primarily of one subject and secondarily of others by reference to it — as "healthy" is said of medicine only because it causes health in the animal [1]. In the analogy of proportionality, each analogate possesses the perfection intrinsically but according to its own mode of being, so that the creature\'s goodness is to the creature as God\'s goodness is to God [2].\n\nThe distinction matters because it determines whether creatures truly possess the perfections we attribute to them or merely stand in an extrinsic causal relation. Aquinas maintains that divine names signify perfections that genuinely pre-exist in God in a more eminent way, and that the res significata (the reality signified) is found properly in God and derivatively in creatures [3].',
    citations: [
      {
        id: "r10-c1",
        marker: "1",
        source: "Summa Theologiae I, q. 13, a. 5, co.",
        originalText:
          "Dicendum quod in huiusmodi analogia, non est eadem ratio nominis, sicut est in univocis; nec totaliter diversa, sicut in aequivocis; sed nomen quod sic multipliciter dicitur, significat diversas proportiones ad aliquid unum.",
        translation:
          "It must be said that in this kind of analogy, the meaning of the term is not entirely the same, as in univocal predication; nor entirely different, as in equivocal predication; but the term used in these many ways signifies various proportions to some one thing.",
      },
      {
        id: "r10-c2",
        marker: "2",
        source: "De Veritate, q. 2, a. 11, co.",
        originalText:
          "Aliquando vero nomen commune imponitur ab aliqua proportione duorum ad duo diversa, sicut sanum dicitur de medicina et urina, inquantum utrumque habet ordinem et proportionem ad sanitatem animalis.",
        translation:
          "Sometimes, however, a common term is imposed from some proportion of two things to two different things, as 'healthy' is said of medicine and of urine insofar as each has an order and proportion to the health of the animal.",
      },
      {
        id: "r10-c3",
        marker: "3",
        source: "Summa Theologiae I, q. 13, a. 6, co.",
        originalText:
          "Nomina enim sic dicta de Deo et creaturis, secundum ordinem quendam dicuntur de Deo per prius et de creaturis per posterius; inquantum omnes rerum perfectiones descendunt a Deo.",
        translation:
          "For such names as are said of God and creatures are said of God primarily and of creatures secondarily, insofar as all the perfections of things descend from God.",
      },
    ],
  },
};

// ── Lookup ──────────────────────────────────────────────────────────

export function getResultById(id: string): FullResult | undefined {
  return results[id];
}
