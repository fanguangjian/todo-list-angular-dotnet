using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using todo_service_api.Common;

namespace todo_service_api.Filters;

public class ApiResponseFilter : IResultFilter
{
    public void OnResultExecuting(ResultExecutingContext context)
    {
        if (context.Result is ObjectResult obj && obj.Value is not ApiResponse)
        {
            var message = obj.StatusCode switch
            {
                201 => "Created",
                204 => "No Content",
                _   => "Success"
            };

            context.Result = new ObjectResult(new ApiResponse<object>(
                obj.StatusCode ?? 200, message, obj.Value))
            {
                StatusCode = obj.StatusCode
            };
        }
    }

    public void OnResultExecuted(ResultExecutedContext context) { }
}
