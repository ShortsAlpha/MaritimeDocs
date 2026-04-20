import { r2, R2_BUCKET_NAME } from '@/lib/r2';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const prefix = searchParams.get('prefix') || '';

        const res = await r2.send(new ListObjectsV2Command({
            Bucket: R2_BUCKET_NAME,
            Prefix: prefix,
            MaxKeys: 100
        }));

        return NextResponse.json({
            bucket: R2_BUCKET_NAME,
            prefixSearch: prefix,
            count: res.Contents?.length || 0,
            keys: res.Contents?.map(o => ({
                Key: o.Key,
                Size: o.Size,
            })) || []
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
    }
}
