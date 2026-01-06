import React, { useMemo, useRef, useEffect } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * MathTypingEffect Component
 * Renders text with typing animation while properly displaying LaTeX math expressions
 */
const MathTypingEffect = ({ text, progress, isTyping = true }) => {
    const containerRef = useRef(null);

    // ✅ Auto-scroll to keep typing cursor in view
    useEffect(() => {
        if (containerRef.current && isTyping && progress > 0 && progress < 1) {
            const scrollContainer = document.getElementById('lecture-content-scroll');
            if (scrollContainer) {
                // Smooth scroll to bottom to follow typing
                scrollContainer.scrollTo({
                    top: scrollContainer.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }
    }, [progress, isTyping]);
    // ✅ Render math using KaTeX with comprehensive error handling
    const renderMath = (content, displayMode = false) => {
        try {
            let cleanContent = content.trim();

            // Clean up common issues
            cleanContent = cleanContent.replace(/\n/g, ' ');

            const html = katex.renderToString(cleanContent, {
                displayMode,
                throwOnError: false,
                strict: false,
                trust: true,
                output: 'html',
                errorColor: '#374151',
                macros: {
                    "\\R": "\\mathbb{R}",
                    "\\N": "\\mathbb{N}",
                    "\\Z": "\\mathbb{Z}",
                    "\\Q": "\\mathbb{Q}",
                    "\\C": "\\mathbb{C}",
                    "\\det": "\\operatorname{det}",
                },
            });

            return (
                <span
                    dangerouslySetInnerHTML={{ __html: html }}
                    className={displayMode ? 'block my-1' : 'inline'}
                    style={{ color: 'inherit' }}
                />
            );
        } catch (e) {
            // Fallback: show as styled text
            return (
                <span className="font-mono text-gray-700 bg-gray-100 px-1 rounded text-sm">
                    {content}
                </span>
            );
        }
    };

    // ✅ Parse and render text with math expressions
    const renderTextWithMath = (inputText) => {
        if (!inputText) return null;

        // ✅ First, convert literal \n (backslash+n) to actual newlines
        let processedText = inputText
            .replace(/\\n\\n/g, '\n\n')  // Double newline for paragraphs
            .replace(/\\n/g, '\n');       // Single newline for line breaks

        const parts = [];
        let lastIndex = 0;
        let keyIndex = 0;

        // Extended regex to match:
        // 1. $$...$$ (block math)
        // 2. $...$ (inline math) 
        // 3. \[...\] (block math)
        // 4. \(...\) (inline math)
        // 5. \begin{...}...\end{...} (environments like bmatrix)
        const mathRegex = /(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\\begin\{[^}]+\}[\s\S]+?\\end\{[^}]+\})/g;

        // ✅ Helper to format text with markdown (*bold*, *italic*)
        const formatTextWithMarkdown = (text) => {
            if (!text) return text;

            const formattedParts = [];
            let lastIdx = 0;
            let partKey = 0;

            // Regex for **bold** and *italic*
            const markdownRegex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
            let mdMatch;

            while ((mdMatch = markdownRegex.exec(text)) !== null) {
                // Add text before match
                if (mdMatch.index > lastIdx) {
                    formattedParts.push(text.slice(lastIdx, mdMatch.index));
                }

                const matchedText = mdMatch[0];
                if (matchedText.startsWith('**') && matchedText.endsWith('**')) {
                    // Bold text
                    formattedParts.push(
                        <strong key={`md-${partKey++}`} className="font-bold">
                            {matchedText.slice(2, -2)}
                        </strong>
                    );
                } else if (matchedText.startsWith('*') && matchedText.endsWith('*')) {
                    // Italic text
                    formattedParts.push(
                        <em key={`md-${partKey++}`} className="italic">
                            {matchedText.slice(1, -1)}
                        </em>
                    );
                }

                lastIdx = mdMatch.index + matchedText.length;
            }

            // Add remaining text
            if (lastIdx < text.length) {
                formattedParts.push(text.slice(lastIdx));
            }

            return formattedParts.length > 0 ? formattedParts : text;
        };

        // Helper to render text with line breaks and formatting
        const renderTextPart = (textPart) => {
            const lines = textPart.split('\n');
            const result = [];
            lines.forEach((line, i) => {
                if (line.trim()) {
                    result.push(
                        <span key={keyIndex++}>
                            {formatTextWithMarkdown(line)}
                        </span>
                    );
                }
                // Add line break (except after last line)
                if (i < lines.length - 1) {
                    result.push(<br key={keyIndex++} />);
                }
            });
            return result;
        };

        let match;
        while ((match = mathRegex.exec(processedText)) !== null) {
            // Add text before match
            if (match.index > lastIndex) {
                const textPart = processedText.slice(lastIndex, match.index);
                parts.push(...renderTextPart(textPart));
            }

            // Determine math type and extract content
            let mathContent = match[0];
            let displayMode = false;
            let extractedContent = '';

            if (mathContent.startsWith('$$') && mathContent.endsWith('$$')) {
                displayMode = true;
                extractedContent = mathContent.slice(2, -2);
            } else if (mathContent.startsWith('$') && mathContent.endsWith('$')) {
                extractedContent = mathContent.slice(1, -1);
            } else if (mathContent.startsWith('\\[') && mathContent.endsWith('\\]')) {
                displayMode = true;
                extractedContent = mathContent.slice(2, -2);
            } else if (mathContent.startsWith('\\(') && mathContent.endsWith('\\)')) {
                extractedContent = mathContent.slice(2, -2);
            } else if (mathContent.startsWith('\\begin{')) {
                // Keep full environment for KaTeX
                displayMode = true;
                extractedContent = mathContent;
            }

            parts.push(
                <span key={keyIndex++} className={displayMode ? 'block my-2' : 'inline'}>
                    {renderMath(extractedContent, displayMode)}
                </span>
            );

            lastIndex = match.index + match[0].length;
        }

        // Add remaining text
        if (lastIndex < processedText.length) {
            const remainingText = processedText.slice(lastIndex);
            parts.push(...renderTextPart(remainingText));
        }

        return parts;
    };

    // ✅ Calculate visible text based on progress
    const getVisibleText = useMemo(() => {
        if (!text) return '';
        if (progress >= 1) return text;

        const totalLength = text.length;
        const visibleLength = Math.floor(progress * totalLength);
        return text.slice(0, visibleLength);
    }, [text, progress]);

    // If complete, render full text with math
    if (progress >= 1) {
        return (
            <span ref={containerRef} className="whitespace-pre-wrap">
                {renderTextWithMath(text)}
            </span>
        );
    }

    // Render with typing effect
    return (
        <span ref={containerRef} className="whitespace-pre-wrap">
            {renderTextWithMath(getVisibleText)}
            {/* Blinking cursor */}
            {isTyping && progress < 1 && (
                <span className="inline-block w-0.5 h-4 ml-0.5 bg-gray-800 animate-pulse align-middle"></span>
            )}
        </span>
    );
};

export default MathTypingEffect;