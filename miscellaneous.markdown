---
layout: group
title: Miscellaneous
permalink: /miscellaneous/
order: 0
target_tags: 
 - art
 - boxing
 - COVID
 - miscellaneous
 
---

I like doing a lot of crazy stuff and exploring things - this is the space to show what I've done beyond my three most significant attributes!

<h1>{{ page.title }}</h1>
<div class="tags">
    {% for category in page.categories %}
        <span class="tag">
            <a href="/category/{{ category }}">#{{ category }}</a>
        </span>
    {% endfor %}
</div>