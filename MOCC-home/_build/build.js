require('esbuild').build({entryPoints:['entry.js'],bundle:true,minify:true,format:'iife',platform:'browser',target:'es2020',outfile:'../grader.js',
 nodePaths:[__dirname+'/node_modules'],
 alias:{'adm-zip':__dirname+'/admzip-shim.js'},define:{'process.env.NODE_ENV':'"production"'},logLevel:'warning'})
 .then(()=>console.log('built')).catch(e=>{console.error(e.message);process.exit(1)});
