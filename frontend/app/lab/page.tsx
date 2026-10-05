import {Suspense} from 'react';
import ConceptLab from '@/components/lab/ConceptLab';
export default function LabPage(){return <Suspense fallback={<div className="empty">Opening Concept Lab…</div>}><ConceptLab/></Suspense>}
