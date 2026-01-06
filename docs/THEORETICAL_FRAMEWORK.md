# Theoretical Framework: Economic Foundations of NordiqFlow

*Academic grounding for AI-driven labor market matching*

---

## Abstract

This document establishes the theoretical foundation for NordiqFlow's approach to labor market matching. By grounding our methodology in Nobel Prize-winning economic theory, we demonstrate that semantic skill matching is not merely a technical improvement, but a fundamental solution to well-documented market failures.

---

## 1. The Problem: Labor Market Frictions

### 1.1 Why Unemployment and Vacancies Coexist

Classical economics predicts that labor markets should clear — unemployed workers should fill vacant jobs until equilibrium. Yet we observe:

- **Sweden (2024)**: 7.5% unemployment AND 100,000+ unfilled vacancies
- **EU average**: Similar patterns across all member states

This paradox was explained by **Diamond, Mortensen, and Pissarides (DMP)**, who received the 2010 Nobel Prize for their **Search and Matching Theory**.

### 1.2 The DMP Model

The DMP model identifies **search frictions** as the cause:

1. **Information asymmetry**: Workers don't know which jobs exist; employers don't know which workers are available
2. **Search costs**: It takes time and resources to find matches
3. **Matching inefficiency**: Even when both parties search, they may not find each other

**Key equation** (simplified):
```
M = m(U, V)
```
Where:
- M = successful matches
- U = unemployed workers
- V = vacant jobs
- m() = matching function (determines efficiency)

**NordiqFlow's contribution**: We improve the matching function m() by reducing information asymmetry through semantic skill matching.

---

## 2. Human Capital Theory

### 2.1 Becker's Framework

Gary Becker (Nobel Prize 1992) established that skills are **investments** that generate returns over time.

He distinguished between:

| Type | Definition | Example |
|------|------------|---------|
| **General Human Capital** | Skills valuable to many employers | Communication, leadership, Excel |
| **Specific Human Capital** | Skills valuable to one employer | Company's proprietary software |

### 2.2 The Hidden General Capital Problem

Traditional job matching focuses on **job titles**, which emphasize specific capital:

> "Store Manager at IKEA" → Appears specific to retail

But the underlying skills are highly general:
- Budget management
- Team leadership
- Customer service
- Inventory systems

**NordiqFlow's contribution**: By extracting "skill atoms" from job titles, we reveal general human capital that enables cross-industry transitions.

### 2.3 Mathematical Formulation

Let H = total human capital of worker i:
```
H_i = H_general + H_specific
```

Traditional matching observes only:
```
Signal_traditional = f(job_title) ≈ H_specific
```

NordiqFlow observes:
```
Signal_NordiqFlow = g(skill_atoms) ≈ H_general + H_specific
```

This fuller observation enables better matching.

---

## 3. Signaling Theory

### 3.1 Spence's Model

Michael Spence (Nobel Prize 2001) showed that in markets with **asymmetric information**, agents use **signals** to convey quality.

In labor markets:
- Workers have private information about their productivity
- Employers cannot directly observe productivity
- Workers use **signals** (degrees, job titles, certifications) to indicate quality

### 3.2 The Noise Problem

Signals are imperfect. A job title like "Marketing Manager" could mean:

| Scenario | Actual Skills |
|----------|---------------|
| At a startup | Full-stack: SEO, ads, content, analytics |
| At a corporation | Narrow: Manages agency relationships only |

The same title signals very different skill sets.

### 3.3 Skill Atoms as Cleaner Signals

NordiqFlow replaces noisy title signals with precise skill atoms:

```
Noisy signal:    "Marketing Manager" → Productivity = ???
Clean signal:    [SEO, Google Ads, Content Strategy, Analytics] → Productivity ≈ 0.85
```

**Information gain**:
```
I(productivity; skill_atoms) > I(productivity; job_title)
```

Where I() is mutual information.

---

## 4. The Granularity Gap

### 4.1 Taxonomy Mismatch

A critical insight from our research: job seekers and job postings operate at **different levels of granularity**.

| Actor | Describes Skills As | Example |
|-------|---------------------|---------|
| Job seeker | Specific (leaf nodes) | "Google Ads", "Python pandas" |
| Job posting | General (branch nodes) | "Digital Marketing", "Data Analysis" |

### 4.2 The Matching Failure

When systems require exact ID matches:

```
CV skill:     "Google Ads" (ID: aaQr_mcK_hgK)
Job requires: "Marketing" (ID: 4XyY_MCb_svG)

Result: 0% match (IDs don't match)
Reality: Google Ads ⊂ Digital Marketing ⊂ Marketing
```

### 4.3 Hierarchical Inference

NordiqFlow solves this by traversing the taxonomy graph:

```python
def expand_skill(skill_id, taxonomy):
    """Include all ancestor skills"""
    ancestors = set()
    current = skill_id
    while current in taxonomy['broader']:
        parent = taxonomy['broader'][current]
        ancestors.add(parent)
        current = parent
    return ancestors
```

Now:
```
CV skills (expanded): {"Google Ads", "Digital Marketing", "Marketing", ...}
Job requires:         {"Marketing"}

Result: 100% match on "Marketing"
```

---

## 5. Substitutability and Career Transitions

### 5.1 Pre-Computed Transitions

Arbetsförmedlingen has computed **substitutability scores** between occupations:

```json
{
  "from": "Store Manager",
  "to": "Healthcare Operations Manager",
  "substitutability_level": 75
}
```

Levels:
- **75**: High similarity — direct transition possible
- **50**: Medium — some retraining needed
- **25**: Low — significant retraining required

### 5.2 Theoretical Basis

This aligns with labor economics research on **occupational mobility**:

> Workers move between occupations based on skill overlap, not industry boundaries.

**Citation**: Gathmann, C., & Schönberg, U. (2010). How General Is Human Capital? A Task-Based Approach. Journal of Labor Economics, 28(1), 1-49.

### 5.3 NordiqFlow's Application

We use substitutability scores to:
1. Recommend career transitions users wouldn't consider
2. Calculate skill gaps for each transition
3. Suggest education pathways to close gaps

---

## 6. Evaluation Methodology

### 6.1 The Counterfactual Problem

To measure NordiqFlow's impact, we need to answer:
> "What would have happened to this job seeker WITHOUT semantic matching?"

This is the fundamental problem of causal inference.

### 6.2 Synthetic Control Method

Following **Abadie, Diamond, and Hainmueller (2010)**, we construct synthetic counterfactuals:

1. Identify treated group (NordiqFlow users)
2. Construct synthetic control from weighted combination of non-users
3. Compare outcomes (time to employment, salary, job satisfaction)

```python
def synthetic_control(treated, control_pool, predictors):
    """
    Find weights W such that:
    X_treated ≈ Σ(w_i * X_control_i)
    """
    # Minimize prediction error on pre-treatment outcomes
    weights = optimize(
        objective=lambda w: ||X_treated - X_control @ w||^2,
        constraints=[sum(w) == 1, w >= 0]
    )
    return weights
```

### 6.3 Expected Outcomes

Based on the theoretical framework, we predict:

| Metric | Expected Change | Mechanism |
|--------|-----------------|-----------|
| Time to employment | -20% | Reduced search frictions |
| Skill-job match quality | +30% | Better information |
| Cross-industry transitions | +50% | Revealed general capital |
| Salary at new job | +10% | Better matching |

---

## 7. Policy Implications

### 7.1 For Public Employment Services

1. **Upgrade matching algorithms** from keyword to semantic
2. **Surface substitutability data** to job seekers
3. **Integrate education pathways** into job recommendations

### 7.2 For Education Policy

1. **Align curricula** with skill atom demand
2. **Fund retraining** for high-substitutability transitions
3. **Measure ROI** of education investments via skill acquisition

### 7.3 For Labor Market Regulation

1. **Standardize skill taxonomies** across Nordic countries
2. **Require skill-based job postings** alongside titles
3. **Create portable skill credentials**

---

## 8. Conclusion

NordiqFlow is not merely a technical system — it is an implementation of decades of labor economics research. By:

1. Reducing search frictions (DMP)
2. Revealing general human capital (Becker)
3. Providing cleaner productivity signals (Spence)
4. Bridging the granularity gap (our contribution)

...we create a more efficient, equitable, and dynamic labor market.

---

## References

Abadie, A., Diamond, A., & Hainmueller, J. (2010). Synthetic Control Methods for Comparative Case Studies. *Journal of the American Statistical Association*, 105(490), 493-505.

Becker, G. (1964). *Human Capital: A Theoretical and Empirical Analysis*. University of Chicago Press.

Diamond, P. (1982). Wage Determination and Efficiency in Search Equilibrium. *Review of Economic Studies*, 49(2), 217-227.

Gathmann, C., & Schönberg, U. (2010). How General Is Human Capital? A Task-Based Approach. *Journal of Labor Economics*, 28(1), 1-49.

Mortensen, D., & Pissarides, C. (1994). Job Creation and Job Destruction in the Theory of Unemployment. *Review of Economic Studies*, 61(3), 397-415.

Spence, M. (1973). Job Market Signaling. *Quarterly Journal of Economics*, 87(3), 355-374.

---

*Last updated: January 5, 2026*
