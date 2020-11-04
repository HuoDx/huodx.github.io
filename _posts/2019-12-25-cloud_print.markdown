---
layout: post
title:  "Cloud Print: an Excellent School-wide Printing Service"
date: 2019-12-25 16:00:00 +0800
tags: 
 - computer science
 - entrepreneurship
---

![](/assets/img/KEEER/CP/intro.png)

Cloud Print (CP) is a school-wide non-profit  printing service developed by KEEER, and then applied and maintained by the Tech. Department of the RDFZ ICC Student Government. The official release date is December 25th, 2019.

# You can print your document within 3 minutes:

1.	Drag your file to upload


2.	Configure your need (double-sided, need colored printing, copies)


3.	Go to the printer and type your printing code to get your file printed

![](/assets/img/KEEER/CP/site.jpg)

# Engineering Highlights

 - 6200+ lines of code by 5 people!

 - Using LAN to make uploading fast:
    - Network discovery for changing IP addresses 
    -  Using sslip.io   and our wildcard certificate to enable HTTPS for encrypted upload inside the LAN (so that it is protected by TLS even if a hacker hijacked the LAN and captures the packets when students are uploading files).

 - Using RSA signatures in communications with the remote server to prevent possible attacks .

 - No discovered vulnerabilities for SQL injection attack.

 - Contactless virtual keyboard implemented in response to the COVID-19 pandemic.

# Now on GitHub for everybody to use!

As open-source software supporters, we made this project avaliable on GitHub.

The source code for `Remote` End: [Click Here](https://github.com/KEEER/cloud-print-remote)

The source code for `Endpoint` Site: [Click Here](https://github.com/KEEER/cloud-print-endpoint)