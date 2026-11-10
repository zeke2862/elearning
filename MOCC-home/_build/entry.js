const { extractDocx } = require('../../MOCC/lib/docxExtractor');
const { grade } = require('../../MOCC/lib/ruleEngine');
const { extractXlsx } = require('../../MOCC/lib/xlsxExtractor');
const { gradeXlsx } = require('../../MOCC/lib/xlsxRuleEngine');
function gradeSubmission(rule, bytes) {
  if (rule.fileType === 'xlsx') return gradeXlsx(extractXlsx(bytes), rule);
  return grade(extractDocx(bytes), rule);
}
window.MoccGrader = { gradeSubmission };
