import { NextResponse } from "next/server";

type ErrorPayload = {
    code: string;
    message: string;
    details?: unknown;
};

export function apiOk<T>(data: T, status = 200, message?: string) {
    return NextResponse.json(
        {
            success: true,
            data,
            ...(message ? { message } : {}),
        },
        { status }
    );
}

export function apiError(error: ErrorPayload, status = 400) {
    return NextResponse.json(
        {
            success: false,
            error,
        },
        { status }
    );
}
