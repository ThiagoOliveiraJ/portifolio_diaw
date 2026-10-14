import { useState } from 'react';
import { Github, SquareArrowOutUpRight } from 'lucide-react';

export function ProjectCard({ projectName, urlImg, description, tags, linksBtns, date, t }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleDescription = () => setIsExpanded(!isExpanded);
    const preview = description.slice(0, 100);

    const hiddenText = t("hidden_text_items", { returnObjects: true });

    return (
        <div className="flex flex-col gap-2 w-xs max-w-full shrink-0">
            {/* timeline marker: line runs edge to edge so cards form one continuous horizontal timeline */}
            <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-[#1C243A] dark:bg-white shrink-0" />
                <span className="h-px flex-1 bg-zinc-300 dark:bg-zinc-700" />
            </div>
            <small className="text-xs tracking-widest uppercase text-zinc-500">{date}</small>

            <div className="mr-5 flex-1 border-1 text-[#1C243A] border-[#1C243A]/30 dark:border-white/30 dark:text-[white] p-3 flex flex-col gap-2 rounded-lg hover:translate-y-2 transition-all duration-400">
                <p className="font-semibold">{projectName}</p>
                <img className="w-full dark:grayscale dark:hover:grayscale-0 rounded-md" src={urlImg} alt="" />

                <p className={`text-xs ${isExpanded ? "min-h-[8rem]" : ""}`}>
                    {isExpanded ? description : `${preview}... `}
                    <button
                        onClick={toggleDescription}
                        className="text-[#1C243A] dark:text-[#cccc] underline text-xs ml-1 hover:text-[#ccc] hover:cursor-pointer"
                    >
                        {isExpanded ? hiddenText[0] : hiddenText[1]}
                    </button>
                </p>
                <div className="flex items-start justify-center flex-col gap-3 mt-auto">
                    <div className="flex flex-wrap items-center gap-1 mt-2">
                        {tags.map((item, index) => (
                            <p key={index} className="border py-1 px-3 text-xs rounded-full">{item}</p>
                        ))}
                    </div>
                    <div className="flex items-center justify-end gap-2">
                        <a href={linksBtns[0]} aria-label="GitHub" className="flex justify-center items-center gap-2 border border-[#1C243A] dark:border-white p-2 rounded-md dark:hover:text-[#ccc] hover:cursor-pointer hover-scale" target="_blank" rel="noreferrer">
                            <Github size={24} />
                        </a>
                        <a href={linksBtns[1]} aria-label="Link" className="flex justify-center items-center gap-2 border border-[#1C243A] dark:border-white p-2 rounded-md dark:hover:text-[#ccc] hover:cursor-pointer hover-scale" target="_blank" rel="noreferrer">
                            <SquareArrowOutUpRight size={24} />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
