namespace todo_service_api.Common;

public record ApiResponse<T>(int Status, string Message, T? Data)
{
    public static ApiResponse<T> Ok(T data, string message = "Success") =>
        new(200, message, data);

    public static ApiResponse<T> Created(T data, string message = "Created") =>
        new(201, message, data);
}

public record ApiResponse(int Status, string Message)
{
    public static ApiResponse Fail(int status, string message, string? path = null) =>
        new ErrorResponse(status, message, path);
}

public record ErrorResponse(int Status, string Message, string? Path)
    : ApiResponse(Status, Message);
