import sys, json
from flask import Flask, render_template, jsonify
from flask_flatpages import FlatPages, pygments_style_defs
from flask_frozen import Freezer

DEBUG = False
FLATPAGES_AUTO_RELOAD = DEBUG
FLATPAGES_EXTENSION = '.md'
FLATPAGES_ROOT = 'content'
POST_DIR = 'posts'
PORT_DIR = 'portfolio'
app = Flask(__name__)
flatpages = FlatPages(app)
freezer = Freezer(app)
app.config.from_object(__name__)


def get_cards(flatpages, port_dir):
    cards = []
    for card in flatpages:
        if card.path.startswith(port_dir + '/'):  # Проверяем начало пути с учетом '/'
            order = card.meta.get('order', float('inf'))
            cards.append((order, card))
    cards.sort(key=lambda x: x[0])
    return [card for _, card in cards]

@app.route("/")
def index():
    posts = [p for p in flatpages if p.path.startswith(POST_DIR)]
    posts.sort(key=lambda item: item['date'], reverse=True)
    cards = get_cards(flatpages, PORT_DIR)   
    with open('settings.txt', encoding='utf8') as config:
        data = config.read()
        settings = json.loads(data)
    tags = set()
    for p in flatpages:
        t = p.meta.get('tag')
        if t:
            tags.add(t.lower())

    return render_template('index.html', posts=posts, cards=cards, bigheader=True, **settings, tags=tags)


@app.route('/posts/<name>/')
def post(name):
    path = '{}/{}'.format(POST_DIR, name)
    post = flatpages.get_or_404(path)
    return render_template('post.html', post=post)


@app.route('/portfolio/<name>/')
def card(name):
    path = '{}/{}'.format(PORT_DIR, name)
    card = flatpages.get_or_404(path)
    return render_template('card.html', card=card)


@app.route('/pygments.css')
def pygments_css():
    return pygments_style_defs('monokai'), 200, {'Content-Type': 'text/css'}


@app.route('/chatbot_scenario')
def chatbot_scenario():
    with open('static/data/chatbot_texts.json', encoding='utf8') as f:
        data = json.load(f)
    return jsonify(data)


@app.route('/robots.txt')
def robots_txt():
    return (
        "User-agent: *\n"
        "Disallow:\n"
        "Sitemap: https://advocate34.ru/sitemap.xml\n",
        200,
        {'Content-Type': 'text/plain'}
    )

@app.route('/sitemap.xml')
def sitemap():
    from flask import Response, url_for
    import datetime

    # Главная страница
    urls = [
        {
            "loc": url_for('index', _external=True),
            "changefreq": "weekly",
            "priority": "1.0"
        }
    ]

    # Посты
    posts = [p for p in flatpages if p.path.startswith(POST_DIR)]
    for post in posts:
        urls.append({
            "loc": url_for('post', name=post.path.replace(POST_DIR + '/', ''), _external=True),
            "changefreq": "monthly",
            "priority": "0.7"
        })

    # Карточки портфолио
    cards = get_cards(flatpages, PORT_DIR)
    for card in cards:
        urls.append({
            "loc": url_for('card', name=card.path.replace(PORT_DIR + '/', ''), _external=True),
            "changefreq": "monthly",
            "priority": "0.8"
        })

    # Можно добавить другие важные страницы вручную, если нужно

    xml = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for url in urls:
        xml.append("  <url>")
        xml.append(f"    <loc>{url['loc']}</loc>")
        xml.append(f"    <changefreq>{url['changefreq']}</changefreq>")
        xml.append(f"    <priority>{url['priority']}</priority>")
        xml.append("  </url>")
    xml.append('</urlset>')
    return Response('\n'.join(xml), mimetype='application/xml')

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "build":
        freezer.freeze()
    else:
        app.run(host='127.0.0.1', port=8000, debug=DEBUG)
