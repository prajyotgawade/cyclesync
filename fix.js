const fs = require('fs');
let code = fs.readFileSync('src/screens/LogScreen.tsx', 'utf8');

// 1. Add DRY to Cervical Fluid
code = code.replace(
  /{ id: 'NONE', label: 'Dry \/ None 🌵' },/g,
  `{ id: 'NONE', label: 'None 🚫' },\n                { id: 'DRY', label: 'Dry 🌵' },`
);

// 2. Add chipsScrollContent style
if (!code.includes('chipsScrollContent')) {
  code = code.replace(
    /chipsRow: {[^}]*},/g,
    `chipsScrollContent: {\n    paddingRight: 16,\n  },\n  chipsRow: {\n    flexDirection: 'row',\n    flexWrap: 'wrap',\n  },`
  );
}

// 3. Remove marginBottom from chipBtn
code = code.replace(/chipBtn: {[^}]*}/g, (match) => {
  return match.replace(/marginBottom: 8,\n\s*/g, '');
});

// 4. Change all chipsRow Views to ScrollViews
code = code.replace(/<View style=\{styles\.chipsRow\}>([\s\S]*?)<\/View>(\s*<\/(?:Card|View)>)/g, (match, inner, suffix) => {
  return `<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScrollContent}>${inner}</ScrollView>${suffix}`;
});

fs.writeFileSync('src/screens/LogScreen.tsx', code);
console.log('Fixed LogScreen!');
