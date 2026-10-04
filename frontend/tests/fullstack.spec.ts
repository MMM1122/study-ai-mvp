import {test,expect} from '@playwright/test';

test('real backend: organize, upload, generate demo notes, persist and report missing model key',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 // Connect directly to the isolated real FastAPI server so browser multipart
 // uploads reach it unchanged. Both servers refuse to reuse existing processes.
 await page.goto('/library');
 await page.getByPlaceholder('New subject, e.g. CPSC 213').fill('Cross-disciplinary systems');
 await page.getByRole('button',{name:'Create',exact:true}).click();
 await page.getByRole('link',{name:/Cross-disciplinary systems/}).click();
 await page.getByPlaceholder('New folder',{exact:true}).fill('Shared patterns');
 await page.getByRole('button',{name:'Create folder',exact:true}).click();
 await page.getByRole('button',{name:/Shared patterns/}).click();
 await page.getByLabel('Choose course material').setInputFiles('../samples/cross_discipline_lab_sample.md');
 await page.getByRole('button',{name:'Upload',exact:true}).click();
 await expect(page).toHaveURL(/\/documents\/\d+$/);
 const documentURL=page.url();
 await expect(page.getByRole('heading',{name:'cross_discipline_lab_sample',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Generate study notes',exact:true}).click();
 await expect(page.locator('.notes')).toContainText('demo mode');
 await page.reload();
 await expect(page.locator('.notes')).toContainText('demo mode');
 await page.getByRole('button',{name:'Open / generate Concept Lab →',exact:true}).click();
 await expect(page.locator('.document-lab-invite .error')).toContainText('OPENROUTER_API_KEY');
 await page.getByRole('link',{name:'Explore curated labs',exact:true}).click();
 await expect(page.locator('.concept-card')).toHaveCount(11);
 await page.goto('/library');
 await page.getByRole('link',{name:/Cross-disciplinary systems/}).click();
 await page.getByRole('button',{name:/Shared patterns/}).click();
 await page.getByRole('link',{name:/cross_discipline_lab_sample/}).click();
 await expect(page).toHaveURL(documentURL);
 await expect(page.locator('.notes')).toContainText('demo mode');
 expect(errors).toEqual([]);
});
