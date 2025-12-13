import * as p from 'drizzle-orm/pg-core';

export const notificationTypeEnum = p.pgEnum('notification_type', [
	'todoist_video_live',
	'discord_video_live',
	'discord_flagged_comment'
]);

export const channels = p.pgTable('channels', {
	ytChannelId: p.varchar('yt_channel_id', { length: 55 }).primaryKey(),
	name: p.text('name').notNull(),
	findSponsorPrompt: p.text('find_sponsor_prompt').notNull(),
	createdAt: p.timestamp('created_at').notNull().defaultNow()
});

export const videos = p.pgTable(
	'videos',
	{
		ytVideoId: p.varchar('yt_video_id', { length: 55 }).primaryKey(),
		ytChannelId: p.varchar('yt_channel_id', { length: 55 }).notNull(),
		title: p.varchar('title', { length: 255 }).notNull(),
		description: p.text('description').notNull(),
		thumbnailUrl: p.text('thumbnail_url').notNull(),
		publishedAt: p.timestamp('published_at').notNull(),
		viewCount: p.integer('view_count').notNull(),
		likeCount: p.integer('like_count').notNull(),
		commentCount: p.integer('comment_count').notNull(),
		createdAt: p.timestamp('created_at').notNull().defaultNow()
	},
	(table) => [
		p.index('yt_channel_id_and_published_at').on(table.ytChannelId, table.publishedAt),
		p.index('videos_channel_title_search').on(table.ytChannelId, table.title)
	]
);

export const comments = p.pgTable(
	'comments',
	{
		ytCommentId: p.varchar('yt_comment_id', { length: 55 }).primaryKey(),
		ytVideoId: p.varchar('yt_video_id', { length: 55 }).notNull(),
		text: p.text('text').notNull(),
		author: p.text('author').notNull(),
		publishedAt: p.timestamp('published_at').notNull(),
		likeCount: p.integer('like_count').notNull(),
		replyCount: p.integer('reply_count').notNull(),
		isEditingMistake: p.boolean('is_editing_mistake').notNull(),
		isSponsorMention: p.boolean('is_sponsor_mention').notNull(),
		isQuestion: p.boolean('is_question').notNull(),
		isPositiveComment: p.boolean('is_positive_comment').notNull(),
		isProcessed: p.boolean('is_processed').notNull(),
		createdAt: p.timestamp('created_at').notNull().defaultNow()
	},
	(table) => [
		p.index('yt_video_id_comments').on(table.ytVideoId),
		p.index('yt_comment_id').on(table.ytCommentId)
	]
);

export const sponsors = p.pgTable(
	'sponsors',
	{
		sponsorId: p.varchar('sponsor_id', { length: 55 }).primaryKey(),
		ytChannelId: p.varchar('yt_channel_id', { length: 55 }).notNull(),
		sponsorKey: p.varchar('sponsor_key', { length: 255 }).notNull(),
		name: p.varchar('name', { length: 255 }).notNull(),
		createdAt: p.timestamp('created_at').notNull().defaultNow()
	},
	(table) => [
		p.index('yt_channel_id_sponsors').on(table.ytChannelId),
		p.index('sponsor_key').on(table.sponsorKey),
		p.index('sponsors_channel_key_search').on(table.ytChannelId, table.sponsorKey),
		p.index('sponsors_name_search').on(table.ytChannelId, table.name)
	]
);

export const sponsorToVideos = p.pgTable(
	'sponsor_to_videos',
	{
		sponsorId: p.varchar('sponsor_id', { length: 55 }).notNull(),
		ytVideoId: p.varchar('yt_video_id', { length: 55 }).notNull(),
		createdAt: p.timestamp('created_at').notNull().defaultNow()
	},
	(table) => [
		p.primaryKey({ columns: [table.sponsorId, table.ytVideoId] }),
		p.index('sponsor_id_sponsor_to_videos').on(table.sponsorId),
		p.index('yt_video_id_sponsor_to_videos').on(table.ytVideoId)
	]
);

export const notifications = p.pgTable(
	'notifications',
	{
		notificationId: p.varchar('notification_id', { length: 55 }).primaryKey(),
		ytVideoId: p.varchar('yt_video_id', { length: 55 }).notNull(),
		type: notificationTypeEnum('type').notNull(),
		success: p.boolean('success').notNull(),
		message: p.text('message').notNull(),
		commentId: p.varchar('comment_id', { length: 55 }),
		createdAt: p.timestamp('created_at').notNull().defaultNow()
	},
	(table) => [p.index('yt_video_id_notifs').on(table.ytVideoId)]
);
