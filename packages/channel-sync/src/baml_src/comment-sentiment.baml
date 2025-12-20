class CommentSentiment {
  isEditingMistake bool
  isSponsorMention bool
  isQuestion bool
  isPositiveComment bool
}

function ClassifyComment(comment: string, videoSponsor: string | null) -> CommentSentiment {
    client OpenrouterGptOssClient
    prompt #"
        Read this comment decide if it mentions an editing mistake (something wrong with the video's audio, video, title, thumbnail, or description), the video's sponsor, and/or is a question.
        Also decide if the comment is generally positive or negative.

        The video's sponsor is {{ videoSponsor }}

        The comment is:
        {{ comment }}

        {{ ctx.output_format }}
    "#
}

test g2i_mention {
  functions [ClassifyComment]
  args {
    comment "Can confirm, used g2i and have made a hire.  BUT... they did not go from interview to first pull request in one week.  It was 2 pull requests.  :)"
    videoSponsor "g2i"
  }
  @@assert({{ this.isSponsorMention == true}})
  @@assert({{ this.isQuestion == false}})
  @@assert({{ this.isEditingMistake == false}})
  // need to optimize the prompt for this...
  @@assert({{ this.isPositiveComment == true}})
}

test positive_comment {
    functions [ClassifyComment]
    args {
        comment "AI therapist is so funny 😂 'You passed the test!' lmao"
        videoSponsor null
    }
}

test question_comment {
    functions [ClassifyComment]
    args {
        comment "what's `renanme`"
        videoSponsor "greptile"
    }
}

test negative_question_comment {
    functions [ClassifyComment]
    args {
        comment "Why are you paying for API usage? Just use Max for 100 bucks!  Aren't you an investor who can afford $ 100 a month?"
        videoSponsor "rork"
    }
}