import pathlib
root = pathlib.Path(__file__).parent / 'src'
order = ['core.js', 'widgets.js', 'data.js', 'trips.js', 'skins.js', 'app.js', 'panels.js', 'editor.js']
js = '\n'.join((root / f).read_text() for f in order)
html = (root / 'shell.html').read_text().replace('/*CSS*/', (root / 'style.css').read_text()).replace('/*JS*/', js)
out = pathlib.Path(__file__).parent / 'www'
out.mkdir(exist_ok=True)
(out / 'index.html').write_text(html)
print('built', len(html) // 1024, 'KB')
