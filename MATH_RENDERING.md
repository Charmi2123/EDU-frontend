# Mathematical Expression Rendering

## Overview
The application now supports beautiful rendering of mathematical expressions using **KaTeX** library. Math expressions are automatically detected and rendered as SVG for perfect display.

## How to Use

### Inline Math
Wrap inline mathematical expressions with single dollar signs `$...$`:

**Examples:**
- `$x^2 + y^2 = z^2$` → x² + y² = z²
- `$\frac{a}{b}$` → a/b (as fraction)
- `$\sqrt{16}$` → √16
- `$\alpha + \beta = \gamma$` → α + β = γ

### Block Math
Wrap block (display) mathematical expressions with double dollar signs `$$...$$`:

**Examples:**
```
$$\int_0^1 x^2 dx$$
$$\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$$
$$\lim_{x \to \infty} \frac{1}{x} = 0$$
```

## Common LaTeX Math Symbols

### Superscripts & Subscripts
- `x^2` → x²
- `x_1` → x₁
- `x^{10}` → x¹⁰
- `x_{max}` → xₘₐₓ

### Fractions
- `\frac{a}{b}` → a/b (fraction)
- `\frac{numerator}{denominator}`

### Roots
- `\sqrt{x}` → √x
- `\sqrt[3]{x}` → ³√x (cube root)

### Greek Letters
- `\alpha, \beta, \gamma, \delta`
- `\theta, \pi, \sigma, \omega`
- `\Alpha, \Beta, \Gamma` (uppercase)

### Operators
- `\sum` → Σ (summation)
- `\prod` → Π (product)
- `\int` → ∫ (integral)
- `\lim` → lim
- `\infty` → ∞

### Relations
- `\leq` → ≤
- `\geq` → ≥
- `\neq` → ≠
- `\approx` → ≈
- `\equiv` → ≡

### Special Functions
- `\sin, \cos, \tan`
- `\log, \ln`
- `\exp`

## Examples in Context

### Quadratic Formula
```
The solution is: $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$
```

### Pythagorean Theorem
```
In a right triangle: $a^2 + b^2 = c^2$
```

### Calculus
```
The derivative of $x^n$ is $nx^{n-1}$

$$\frac{d}{dx}(x^n) = nx^{n-1}$$
```

## Components Using Math Rendering

The following components now support automatic math rendering:
1. **AddTopicNarration.jsx** - Topic titles, summaries, subtopic titles, and narrations
2. **MergeChapter.jsx** - Chapter titles, subtopic titles, and narrations
3. **AllChapters.jsx** - Chapter titles, subtopic titles, and narrations

## Technical Details

- **Library**: KaTeX (faster than MathJax)
- **Component**: `MathText.jsx` in `src/Components/Tools/`
- **CSS**: Automatically imported from `katex/dist/katex.min.css`
- **Rendering**: Client-side, instant rendering
- **Fallback**: If no math expressions found, displays as plain text

## Tips

1. **Always use dollar signs** to mark math expressions
2. **Use double backslash** for special characters: `\\alpha` not `\alpha`
3. **Curly braces for groups**: `x^{2y}` not `x^2y`
4. **Test complex expressions** in a LaTeX editor first
5. **Keep it readable**: Don't overuse inline math in long paragraphs
