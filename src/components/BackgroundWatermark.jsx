import React, { useMemo } from 'react';

const BackgroundWatermark = () => {
    // Generate static content once to optimize performance
    const content = useMemo(() => {
        const totalItems = 35; // 20 blue + 15 orange
        const items = [];

        // Add blue repetitions
        for (let i = 0; i < 20; i++) {
            items.push({
                color: 'text-blue-500/10 dark:text-blue-400/10',
                rotate: i % 2 === 0 ? 'rotate-12' : '-rotate-12'
            });
        }

        // Add orange repetitions
        for (let i = 0; i < 15; i++) {
            items.push({
                color: 'text-orange-500/10 dark:text-orange-400/10',
                rotate: i % 2 === 0 ? '-rotate-12' : 'rotate-12'
            });
        }

        // Shuffle items to mix blue and orange
        return items.sort(() => Math.random() - 0.5);
    }, []);

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0">
            <div className="flex flex-wrap justify-around items-center w-[120%] h-[120%] -ml-[10%] -mt-[10%]">
                {content.map((item, index) => (
                    <div
                        key={index}
                        className={`
                            p-8 flex-shrink-0
                            ${item.color}
                            ${item.rotate}
                            text-6xl md:text-8xl lg:text-9xl
                            font-black tracking-tighter
                            transition-opacity duration-1000
                        `}
                    >
                        SLS
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BackgroundWatermark;
