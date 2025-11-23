import { mysqlTable as table } from 'drizzle-orm/mysql-core';
import * as t from 'drizzle-orm/mysql-core';

export const channels = table('channels', {
	ytChannelId: t.varchar('yt_channel_id', { length: 55 }).primaryKey(),
	name: t.text('name').notNull(),
	findSponsorPrompt: t.text('find_sponsor_prompt').notNull(),
	createdAt: t.timestamp('created_at').notNull().defaultNow()
});

export const videos = table(
	'videos',
	{
		ytVideoId: t.varchar('yt_video_id', { length: 55 }).primaryKey(),
		ytChannelId: t.varchar('yt_channel_id', { length: 55 }).notNull(),
		title: t.varchar('title', { length: 255 }).notNull(),
		description: t.text('description').notNull(),
		thumbnailUrl: t.text('thumbnail_url').notNull(),
		publishedAt: t.datetime('published_at').notNull(),
		viewCount: t.int('view_count').notNull(),
		likeCount: t.int('like_count').notNull(),
		commentCount: t.int('comment_count').notNull(),
		createdAt: t.timestamp('created_at').notNull().defaultNow()
	},
	(table) => [
		t.index('yt_channel_id_and_published_at').on(table.ytChannelId, table.publishedAt),
		t.index('videos_channel_title_search').on(table.ytChannelId, table.title)
	]
);

export const comments = table(
	'comments',
	{
		ytCommentId: t.varchar('yt_comment_id', { length: 55 }).primaryKey(),
		ytVideoId: t.varchar('yt_video_id', { length: 55 }).notNull(),
		text: t.text('text').notNull(),
		author: t.text('author').notNull(),
		publishedAt: t.datetime('published_at').notNull(),
		likeCount: t.int('like_count').notNull(),
		replyCount: t.int('reply_count').notNull(),
		isEditingMistake: t.boolean('is_editing_mistake').notNull(),
		isSponsorMention: t.boolean('is_sponsor_mention').notNull(),
		isQuestion: t.boolean('is_question').notNull(),
		isPositiveComment: t.boolean('is_positive_comment').notNull(),
		isProcessed: t.boolean('is_processed').notNull(),
		createdAt: t.timestamp('created_at').notNull().defaultNow()
	},
	(table) => [
		t.index('yt_video_id').on(table.ytVideoId),
		t.index('yt_comment_id').on(table.ytCommentId)
	]
);

export const sponsors = table(
	'sponsors',
	{
		sponsorId: t.varchar('sponsor_id', { length: 55 }).primaryKey(),
		ytChannelId: t.varchar('yt_channel_id', { length: 55 }).notNull(),
		sponsorKey: t.varchar('sponsor_key', { length: 255 }).notNull(),
		name: t.varchar('name', { length: 255 }).notNull(),
		createdAt: t.timestamp('created_at').notNull().defaultNow()
	},
	(table) => [
		t.index('yt_channel_id').on(table.ytChannelId),
		t.index('sponsor_key').on(table.sponsorKey),
		t.index('sponsors_channel_key_search').on(table.ytChannelId, table.sponsorKey),
		t.index('sponsors_name_search').on(table.ytChannelId, table.name)
	]
);

export const sponsorToVideos = table(
	'sponsor_to_videos',
	{
		sponsorId: t.varchar('sponsor_id', { length: 55 }).notNull(),
		ytVideoId: t.varchar('yt_video_id', { length: 55 }).notNull(),
		createdAt: t.timestamp('created_at').notNull().defaultNow()
	},
	(table) => [
		t.primaryKey({ columns: [table.sponsorId, table.ytVideoId] }),
		t.index('sponsor_id').on(table.sponsorId),
		t.index('yt_video_id').on(table.ytVideoId)
	]
);

export const notifications = table(
	'notifications',
	{
		notificationId: t.varchar('notification_id', { length: 55 }).primaryKey(),
		ytVideoId: t.varchar('yt_video_id', { length: 55 }).notNull(),
		type: t
			.mysqlEnum('type', ['todoist_video_live', 'discord_video_live', 'discord_flagged_comment'])
			.notNull(),
		success: t.boolean('success').notNull(),
		message: t.text('message').notNull(),
		commentId: t.varchar('comment_id', { length: 55 }),
		createdAt: t.timestamp('created_at').notNull().defaultNow()
	},
	(table) => [t.index('yt_video_id').on(table.ytVideoId)]
);
