import {test,expect} from '@playwright/test';

test('explore memory, predict, and retain progress after refresh',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await expect(page.getByRole('heading',{name:/Different subjects.*Connected ideas/ })).toBeVisible();
 await page.locator('.concept-card').filter({hasText:'Addresses & memory'}).click();
 await page.locator('#array-index').fill('7');
 await expect(page.locator('.address-result')).toHaveText('0x101C');
 await expect(page.locator('.memory-result')).toContainText('24');
 await page.getByRole('button',{name:'Show hidden steps'}).click();
 await expect(page.locator('.hidden-steps')).toContainText('4096 + 28 = 4124');
 await page.getByRole('tab',{name:'03 Challenge'}).click();
 await expect(page.getByRole('button',{name:'Check my prediction'})).toBeDisabled();
 await page.getByRole('button',{name:'B 0x100C'}).click();
 await page.getByRole('button',{name:'Check my prediction'}).click();
 await expect(page.getByRole('status')).toContainText('Connection made.');
 await expect(page.locator('.progress-pill')).toContainText('1/11');
 await page.reload();
 await expect(page.locator('.progress-pill')).toContainText('1/11');
 expect(errors).toEqual([]);
});

test('feedback, wave and state machine controls implement real transitions',async({page})=>{
 await page.goto('/');
 await page.locator('.concept-card').filter({hasText:'returning to balance'}).click();
 await page.locator('#experiment-variable').fill('1.5');
 await expect(page.locator('.sim-note')).toContainText('Overshoot');
 await expect(page.locator('.chart-sim circle').nth(1)).toHaveAttribute('cy','20');
 await page.locator('.concept-card').filter({hasText:'Waves, rhythm'}).click();
 await page.locator('#experiment-variable').fill('4');
 await expect(page.locator('.formula')).toContainText('T = 0.25 s');
 await page.locator('.concept-card').filter({hasText:'Rules change a state'}).click();
 for(let i=0;i<4;i++)await page.getByRole('button',{name:'Apply one transition'}).click();
 await expect(page.getByRole('button',{name:'Halted',exact:true})).toBeDisabled();
 await expect(page.locator('.tape-cell b')).toHaveText(['0','1','0','1','□']);
 await page.getByRole('button',{name:'Reset tape'}).click();
 await expect(page.locator('.tape-cell b')).toHaveText(['1','0','1','0','□']);
});

test('lenses, filtering, bilingual navigation and mobile layout',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 await page.getByRole('button',{name:'Playful',exact:true}).click();
 await expect(page.locator('.pond-caption')).toHaveText('Imagine a playful gathering.');
 await page.locator('.bridge-tabs').getByRole('button',{name:'Philosophy',exact:true}).click();
 await expect(page.locator('.bridge-boundary')).toContainText('not an experimentally validated');
 await page.getByRole('searchbox').fill('waves');
 await expect(page.locator('.concept-card')).toHaveCount(1);
 await page.getByRole('searchbox').fill('nonexistent concept');
 await expect(page.locator('.lab-empty')).toContainText('No matching concepts');
 await page.getByRole('button',{name:'Clear filters'}).click();
 await page.getByRole('button',{name:'中文',exact:true}).click();
 await expect(page.locator('html')).toHaveAttribute('lang','zh');
 await expect(page.locator('h1')).toContainText('不同学科');
 await expect(page.getByRole('link',{name:'资料库'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.screenshot({path:'test-results/concept-lab-mobile.png',fullPage:true});
});

test('missing backend is explicit and curated labs remain usable',async({page})=>{
 await page.route('**/labs',route=>route.abort());
 await page.goto('/');
 await page.getByRole('button',{name:'My generated labs'}).click();
 await expect(page.locator('.lab-alert')).toContainText('Could not load saved labs');
 await expect(page.locator('.concept-card')).toHaveCount(11);
});

test('saved lessons show provenance and the original library stays accessible',async({page})=>{
 const {default:catalog}=await import('../lib/lab/catalog.json');
 const concept={...catalog.find(c=>c.id==='cpu')!,source_facts:[{quote:'A processor fetches an instruction before decoding it.',page:1}]};
 await page.route('**/labs',route=>route.fulfill({json:[{document_id:42,document_title:'CPU lecture',concepts:[concept],generated_at:'2026-10-04T00:00:00Z',truncated:true}]}));
 await page.goto('/lab?document=42');
 await expect(page.locator('.lesson-heading')).toContainText('Fetch · decode · execute');
 await expect(page.locator('.lesson-heading')).toContainText('FROM YOUR MATERIAL');
 await page.locator('.lesson-sources summary').click();
 await expect(page.locator('.lesson-sources')).toContainText('Only the beginning of the document');
 await expect(page.locator('.lesson-sources blockquote')).toContainText('before decoding it.');
 await expect(page.locator('.lesson-sources a')).toHaveAttribute('href','/documents/42');
 await page.getByRole('button',{name:'Curated collection',exact:true}).click();
 await expect(page.locator('.concept-card')).toHaveCount(11);
 await page.route('**/dashboard',route=>route.fulfill({json:{subjects:0,documents:0,flashcards:0,due:0,recent_documents:[]}}));
 await page.route('**/subjects',route=>route.fulfill({json:[]}));
 await page.getByRole('link',{name:'Library',exact:false}).click();
 await expect(page.getByRole('heading',{name:'Your subjects'})).toBeVisible();
});
