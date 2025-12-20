class SponsorInfo {
  sponsorName string
  sponsorKey string
}

function GetSponsor(sponsorPrompt: string, videoDescription: string) -> SponsorInfo {
  client OpenrouterGptOssClient
  prompt #"
    Parse this youtube video's description to find the video's sponsor. You are looking for the sponsor's name and a key to identify the sponsor in the db. Both the key and name should be lowercase.

    The following will tell you how to get each of those for this channel:
    {{ sponsorPrompt }}

    The video description is:
    {{ videoDescription }}

    {{ ctx.output_format }}
  "#
}

test no_sponsor {
    functions [GetSponsor]
    args {
        sponsorPrompt "The sponsor key for this channel is `https://soydev.link/${SPONSOR_NAME}`. There are often multiple soydev links in the description. The one for the sponsor will come after something similar to 'Thank you ${SPONSOR_NAME} for sponsoring!'. If it doesn't mention that the sponsor name is a sponsor, then there is no sponsor and you should set the sponsor name to 'no sponsor' and the sponsor key to 'https://t3.gg'"
        videoDescription #"
            There's a lot wrong with MCP, thankfully Anthropic seems to be finally doing something about it...

            no sponsor today, go checkout t3 chat: https://soydev.link/chat

SOURCE
https://www.anthropic.com/engineering...

Want to sponsor a video? Learn more here: https://soydev.link/sponsor-me

Check out my Twitch, Twitter, Discord more at https://t3.gg

S/O Ph4se0n3 for the awesome edit 🙏
        "#
    }
}

test sevalla_sponsor {
    functions [GetSponsor]
    args {
        sponsorPrompt "The sponsor key for this channel is `https://soydev.link/${SPONSOR_NAME}`. There are often multiple soydev links in the description. The one for the sponsor will come after something similar to 'Thank you ${SPONSOR_NAME} for sponsoring!'. If it doesn't mention that the sponsor name is a sponsor, then there is no sponsor and you should set the sponsor name to 'no sponsor' and the sponsor key to 'https://t3.gg'"
        videoDescription #"
            There's a lot wrong with MCP, thankfully Anthropic seems to be finally doing something about it...

Thank you Sevalla for sponsoring! Check them out at: https://soydev.link/sevalla

SOURCE
https://www.anthropic.com/engineering...

Want to sponsor a video? Learn more here: https://soydev.link/sponsor-me

Check out my Twitch, Twitter, Discord more at https://t3.gg

S/O Ph4se0n3 for the awesome edit 🙏
        "#
    }
}

test convex_sponsor {
    functions [GetSponsor]
    args {
        sponsorPrompt "The sponsor key for this channel is `https://soydev.link/${SPONSOR_NAME}`. There are often multiple soydev links in the description. The one for the sponsor will come after something similar to 'Thank you ${SPONSOR_NAME} for sponsoring!'. If it doesn't mention that the sponsor name is a sponsor, then there is no sponsor and you should set the sponsor name to 'no sponsor' and the sponsor key to 'https://t3.gg'"
        videoDescription #"
            My journey with Arc was...weird. If you followed me here, I'm sorry. I hope this helps.

Thank you Convex for sponsoring! Check them out at https://soydev.link/convex

PLEASE PAY ZEN BROWSER, THEY NEED TO WIN
https://zen-browser.app/donate/

Check out my Twitch, Twitter, Discord more at https://t3.gg

S/O Ph4se0n3 for the awesome edit 🙏
        "#
    }
}

test g2i_sponsor {
  functions [GetSponsor]
  args {
    sponsorPrompt "The sponsor key for this channel is `https://soydev.link/${SPONSOR_NAME}`. There are often multiple soydev links in the description. The one for the sponsor will come after something similar to 'Thank you ${SPONSOR_NAME} for sponsoring!'. If it doesn't mention that the sponsor name is a sponsor, then there is no sponsor and you should set the sponsor name to 'no sponsor' and the sponsor key to 'https://t3.gg'"
    videoDescription #"
        Claude Code just got a ton of new features, all of which are really really cool. I just wish they worked better...

Thank you G2i for sponsoring! Check them out at: https://soydev.link/g2i

Want to sponsor a video? Learn more here: https://soydev.link/sponsor-me

Check out my Twitch, Twitter, Discord more at https://t3.gg

S/O Ph4se0n3 for the awesome edit 🙏
    "#
  }
}

