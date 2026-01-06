import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * MathText Component
 * Renders text with LaTeX math expressions beautifully formatted
 * 
 * Supports:
 * - Inline math: $x^2 + y^2 = z^2$
 * - Block math: $$\frac{a}{b}$$
 * - Mixed text and math
 */
const MathText = ({ children, className = "" }) => {
    if (!children) return null;

    const text = String(children);

    // Split text by block math ($$...$$) and inline math ($...$)
    const renderMathText = (text) => {
        const parts = [];
        let currentIndex = 0;

        // Regex to match $$...$$ (block) or $...$ (inline)
        const mathRegex = /(\$\$[\s\S]+?\$\$|\$[^\$]+?\$)/g;
        let match;

        while ((match = mathRegex.exec(text)) !== null) {
            // Add text before math
            if (match.index > currentIndex) {
                parts.push({
                    type: 'text',
                    content: text.slice(currentIndex, match.index)
                });
            }

            // Add math expression
            const mathContent = match[0];
            if (mathContent.startsWith('$$') && mathContent.endsWith('$$')) {
                // Block math
                parts.push({
                    type: 'block',
                    content: mathContent.slice(2, -2)
                });
            } else if (mathContent.startsWith('$') && mathContent.endsWith('$')) {
                // Inline math
                parts.push({
                    type: 'inline',
                    content: mathContent.slice(1, -1)
                });
            }

            currentIndex = match.index + mathContent.length;
        }

        // Add remaining text
        if (currentIndex < text.length) {
            parts.push({
                type: 'text',
                content: text.slice(currentIndex)
            });
        }

        return parts;
    };

    const parts = renderMathText(text);

    // If no math found, return plain text
    if (parts.length === 0) {
        return <span className={className}>{text}</span>;
    }

    return (
        <span className={className}>
            {parts.map((part, index) => {
                if (part.type === 'block') {
                    try {
                        const html = katex.renderToString(part.content, {
                            displayMode: true,
                            throwOnError: false
                        });
                        return (
                            <div
                                key={index}
                                className="my-2"
                                dangerouslySetInnerHTML={{ __html: html }}
                            />
                        );
                    } catch (e) {
                        return <div key={index} className="my-2">{part.content}</div>;
                    }
                } else if (part.type === 'inline') {
                    try {
                        const html = katex.renderToString(part.content, {
                            displayMode: false,
                            throwOnError: false
                        });
                        return (
                            <span
                                key={index}
                                dangerouslySetInnerHTML={{ __html: html }}
                            />
                        );
                    } catch (e) {
                        return <span key={index}>{part.content}</span>;
                    }
                } else {
                    return <span key={index}>{part.content}</span>;
                }
            })}
        </span>
    );
};

export default MathText;
