---
title: Fix external display picture quality issue on Mac OS X
date: "2019-09-02T00:00:00.169Z"
template: "post"
draft: false
slug: "/posts/fix-external-display-picture-quality-issue-on-Mac/"
category: "Mac"
tags:
  - "mac"
  - "guide"
  - "ruby"
description: "This guide shows how to override an external display color profile on Mac OS X. It has
been tested on LG 24MP88HV-S."
---

Recently I got an external display the [***LG 24MP88HV-S***](https://www.lg.com/us/displays/lg-24MP88HV-S-led-display),
hoping that it would be a good companion for my macbook pro. But to my surprise the font rendering and 
the contrast was horrible. It was like I needed a pair of corrective lens. After 
digging a couple of hours on the internet for I seemed to have identified what was wrong.


### Problem ###

The display port uses **YCbCr** colors instead of **RGB** to drive the display, which limits
the range of colors and apparently causes the display to apply some undesired post processing.

### Solution ###

Manually override the the Display Profile to use **RGB** mode.

Path `/System/Library/Displays/Overrides`


```ruby{numberLines: true}

require 'base64'

data=`ioreg -l -w0 -d0 -r -c AppleDisplay`

edid_hex=data.match(/IODisplayEDID.*?<([a-z0-9]+)>/i)[1]
vendorid=data.match(/DisplayVendorID.*?([0-9]+)/i)[1].to_i
productid=data.match(/DisplayProductID.*?([0-9]+)/i)[1].to_i

puts "found display: vendorid #{vendorid}, productid #{productid}, EDID:\n#{edid_hex}"

bytes=edid_hex.scan(/../).map{|x|Integer("0x#{x}")}.flatten

puts "Setting color support to RGB 4:4:4 only"
bytes[24] &= ~(0b11000)

puts "Number of extension blocks: #{bytes[126]}"
puts "removing extension block"
bytes = bytes[0..127]
bytes[126] = 0

bytes[127] = (0x100-(bytes[0..126].reduce(:+) % 256)) % 256
puts 
puts "Recalculated checksum: 0x%x" % bytes[127]
puts "new EDID:\n#{bytes.map{|b|"%02X"%b}.join}"

Dir.mkdir("DisplayVendorID-%x" % vendorid) rescue nil
f = File.open("DisplayVendorID-%x/DisplayProductID-%x" % [vendorid, productid], 'w')
f.write '<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">'
f.write "
<dict>
  <key>DisplayProductName</key>
  <string>Display with forced RGB mode (EDID override)</string>
  <key>IODisplayEDID</key>
  <data>#{Base64.encode64(bytes.pack('C*'))}</data>
  <key>DisplayVendorID</key>
  <integer>#{vendorid}</integer>
  <key>DisplayProductID</key>
  <integer>#{productid}</integer>
</dict>
</plist>"
f.close
```

### Final thoughts ###

This hack might not be for everyone. If you dont mind spending a couple of hundred dollars more, you 
can get a much nicer display recommended by Apple and avoid this hassle.



### References ###
* http://embdev.net/topic/284710
* https://gist.github.com/ejdyksen/8302862