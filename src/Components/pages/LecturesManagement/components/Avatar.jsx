import React, { useEffect, useRef, useState } from 'react';

function Avatar({ analyserNode, isPlaying }) {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const [mouthOpen, setMouthOpen] = useState(0);
    const blinkTimerRef = useRef(null);
    const [isBlinking, setIsBlinking] = useState(false);

    // Lipsync from audio analyser
    useEffect(() => {
        if (!analyserNode || !isPlaying) {
            setMouthOpen(0);
            return;
        }

        const dataArray = new Uint8Array(analyserNode.frequencyBinCount);

        const updateLipsync = () => {
            analyserNode.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            const normalized = Math.min(average / 128, 1);
            setMouthOpen(normalized);
            animationRef.current = requestAnimationFrame(updateLipsync);
        };

        updateLipsync();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [analyserNode, isPlaying]);

    // Eye blink animation
    useEffect(() => {
        const blink = () => {
            setIsBlinking(true);
            setTimeout(() => setIsBlinking(false), 150);
            blinkTimerRef.current = setTimeout(blink, 2000 + Math.random() * 3000);
        };

        blink();

        return () => {
            if (blinkTimerRef.current) {
                clearTimeout(blinkTimerRef.current);
            }
        };
    }, []);

    return (
        <div className="relative w-64 h-64">
            <svg viewBox="0 0 200 200" className="w-full h-full">
                {/* Head */}
                <ellipse cx="100" cy="100" rx="60" ry="70" fill="#FFD4A3" stroke="#000" strokeWidth="2" />

                {/* Eyes */}
                <ellipse
                    cx="80"
                    cy="85"
                    rx="8"
                    ry={isBlinking ? "2" : "10"}
                    fill="#000"
                    className="transition-all duration-150"
                />
                <ellipse
                    cx="120"
                    cy="85"
                    rx="8"
                    ry={isBlinking ? "2" : "10"}
                    fill="#000"
                    className="transition-all duration-150"
                />

                {/* Mouth - Lipsync */}
                <ellipse
                    cx="100"
                    cy="120"
                    rx="20"
                    ry={5 + mouthOpen * 15}
                    fill="#FF6B6B"
                    stroke="#000"
                    strokeWidth="1.5"
                    className="transition-all duration-100"
                />

                {/* Nose */}
                <path d="M 100 95 L 95 105 L 105 105 Z" fill="#E8B88A" />
            </svg>
        </div>
    );
}

export default Avatar;








// import React, { useEffect, useRef, useState } from 'react';

// function Avatar({ analyserNode, isPlaying }) {
//     const canvasRef = useRef(null);
//     const animationRef = useRef(null);
//     const [mouthOpen, setMouthOpen] = useState(0);
//     const blinkTimerRef = useRef(null);
//     const [isBlinking, setIsBlinking] = useState(false);

//     // Lipsync from audio analyser
//     useEffect(() => {
//         if (!analyserNode || !isPlaying) {
//             setMouthOpen(0);
//             return;
//         }

//         const dataArray = new Uint8Array(analyserNode.frequencyBinCount);

//         const updateLipsync = () => {
//             analyserNode.getByteFrequencyData(dataArray);
//             const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
//             const normalized = Math.min(average / 128, 1);
//             setMouthOpen(normalized);
//             animationRef.current = requestAnimationFrame(updateLipsync);
//         };

//         updateLipsync();

//         return () => {
//             if (animationRef.current) {
//                 cancelAnimationFrame(animationRef.current);
//             }
//         };
//     }, [analyserNode, isPlaying]);

//     // Eye blink animation
//     useEffect(() => {
//         const blink = () => {
//             setIsBlinking(true);
//             setTimeout(() => setIsBlinking(false), 150);
//             blinkTimerRef.current = setTimeout(blink, 2000 + Math.random() * 3000);
//         };

//         blink();

//         return () => {
//             if (blinkTimerRef.current) {
//                 clearTimeout(blinkTimerRef.current);
//             }
//         };
//     }, []);

//     return (
//         <div className="relative w-64 h-64">
//             <svg viewBox="0 0 200 200" className="w-full h-full">
//                 {/* Head */}
//                 <ellipse cx="100" cy="100" rx="60" ry="70" fill="#FFD4A3" stroke="#000" strokeWidth="2" />

//                 {/* Eyes */}
//                 <ellipse
//                     cx="80"
//                     cy="85"
//                     rx="8"
//                     ry={isBlinking ? "2" : "10"}
//                     fill="#000"
//                     className="transition-all duration-150"
//                 />
//                 <ellipse
//                     cx="120"
//                     cy="85"
//                     rx="8"
//                     ry={isBlinking ? "2" : "10"}
//                     fill="#000"
//                     className="transition-all duration-150"
//                 />

//                 {/* Mouth - Lipsync */}
//                 <ellipse
//                     cx="100"
//                     cy="120"
//                     rx="20"
//                     ry={5 + mouthOpen * 15}
//                     fill="#FF6B6B"
//                     stroke="#000"
//                     strokeWidth="1.5"
//                     className="transition-all duration-100"
//                 />

//                 {/* Nose */}
//                 <path d="M 100 95 L 95 105 L 105 105 Z" fill="#E8B88A" />
//             </svg>
//         </div>
//     );
// }

// export default Avatar;
