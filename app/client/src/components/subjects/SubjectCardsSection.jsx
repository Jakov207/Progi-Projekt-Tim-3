// client/src/components/subjects/SubjectCardsSection.jsx
import React from 'react';
import SubjectCard from './SubjectCard';
import styles from './SubjectCardsSection.module.css';

// 1. KORAK: Definiramo podatke na jednom mjestu (lista objekata)
const subjectsData = [
    {
        title: "Fizika",
        description: "Instruktori iz fizike za osnovne i srednje škole, te fakultete koji će ti pomoći..."
    },
    {
        title: "Informatika",
        description: "Instruktori iz informatike za osnovne i srednje škole, te fakultete koji će ti pomoći..."
    },
    {
        title: "Matematika",
        description: "Instruktori iz matematike za osnovne i srednje škole, te fakultete koji će ti pomoći..."
    }
];

const SubjectCardsSection = () => {
    return (
        <section className={styles.section}>
            <div className={styles.container}>
                {/* 2. KORAK: Koristimo .map() da prođemo kroz listu i generiramo kartice */}
                {subjectsData.map((subject) => (
                    <SubjectCard
                        key={subject.title} // 'key' je važan za React da prati elemente u listi
                        title={subject.title}
                        description={subject.description}
                    />
                ))}
            </div>
        </section>
    );
};

export default SubjectCardsSection;