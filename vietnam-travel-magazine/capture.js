const puppeteer = require('puppeteer');
const fs = require('fs');
(async ()=>{
  const url='http://localhost:3000';
  const browser = await puppeteer.launch({args:['--no-sandbox','--disable-setuid-sandbox']});
  try{
    const page = await browser.newPage();
    const viewports=[{name:'desktop',w:1280,h:900},{name:'tablet',w:980,h:800},{name:'mobile',w:520,h:900}];
    for(const v of viewports){
      await page.setViewport({width:v.w,height:v.h});
      await page.goto(url,{waitUntil:'networkidle2',timeout:15000});
      // give app time to render dynamic data
      await page.waitForTimeout(800);
      const path=`/Users/youngdonjang/.openclaw/workspace/dashboard-ui/snap_${v.name}.png`;
      await page.screenshot({path,fullPage:true});
      console.log('wrote',path);
    }
  }catch(e){
    console.error('err',e.message);
    process.exit(2);
  }finally{
    await browser.close();
  }
})();
