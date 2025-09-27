import React from "react";

interface TittlexProps {
    title: string;
    description: string;
}

const Tittlex: React.FC<TittlexProps> = ({ title, description }) => {
    return (
        <div className="flex flex-col gap-2 items-start">
            <div className="flex items-center gap-2">
                {/* Línea horizontal */}
                <div className="w-[5px] h-[26px] bg-primary rounded-md"></div>
                <h1 className="text-3xl font-bold text-primary font-roboto">{title}</h1>
            </div>
            <p className="text-base text-gray60 font-roboto">{description}</p>
        </div>
    );
};

export default Tittlex;
