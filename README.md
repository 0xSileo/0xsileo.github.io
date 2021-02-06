## Who is this README aimed at ?
This document is aimed at people looking at this code of course but most importantly at me lmao. It will try to summarize/explain my code so that I do not feel lost if I want to work on it later on. I believe that good documentation or commenting is necessary (but not sufficient) for producing good code.

## Axioms & best practices
When writing code -or anything else for that matter- there are some practices that are _better_ than others. While some are just a personal preference and do not impact the readability that much (_e.g._ tabs vs spaces), others are much more conventional and objectively better.

I will list here (in no particular order) the practices and conventions I try to adopt when I write this site. There may be some things I got wrong or that went over my head but as it is my first website, I _know_ that there is room for improvement. Feel free to get in touch and share your opinions on it though.

### CSS over JavaScript

When writing an animation, I try to do it in CSS as much as possible. This handles browser compatibility, JavaScript blocking, I believe it saves a little computing resources, and it's just that CSS is made for that. I could use very basic CSS stuff and fill the rest with JavaScript but CSS is much more versatile than one might think.

### Code once, scale infinitely
This is more about programming but it finds its use in markdown languages. Write scalable code. You never know when you will have to use it again. Plus, if you are 100% confident you won't use it, it teaches you nice habits for the future.

### Avoid repetition

Kind of emphasizes the previous point. If you have to copy-paste your code, there might just be a way to avoiding it. And sometimes this adds way more lines than you need so make sure to weigh the pros and cons

### Use built-in functions

Use `button`, not `div`. Illustrative example here but I think you get the point. Don't reinvent the wheel. This matches what I said about diving into CSS instead of just writing JS.

### A framework is not needed.

React, Angular, Vue, etc. may be nice but I see no use for them right now. Plus, if I start from scratch, I may develop more skills and understanding.

## HTML

I find my folders and files decently organized so it is not my top priority.

## CSS
As of now, I need to rearrange my CSS files a bit more neatly. I focused on working features and compatibility but I still have to organize them. By that I mean removing what is redundant, merge and split files, comment them a bit more

## JavaScript
I didn't write that much JS and I think that it is pretty well organized. Might take a look at it but my focus stays on CSS. Indeed, the latter is more prone to spaghettification imo.
