using Domain.Models.ChatHistories;
using Infrastructure.Mongo;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using nBanks.Application.ChatHistories;
using nBanks.Application.Documents;

namespace nBanks.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatHistoryController : ControllerBase
    {
        private readonly ChatHistoryService _chatHistoryService;
        private readonly DocumentService _documentService;

        public ChatHistoryController(ChatHistoryService context, DocumentService documentService)
        {
            _chatHistoryService = context;
            _documentService = documentService;
        }
        

        [HttpPost("create")]
        public async Task<IActionResult> CreateAsync(ChatHistoryDTO dto)
        {
            try
            {
                var res = await _chatHistoryService.AddChatHistory(dto);
                return Ok(res); 
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("user")]
        public async Task<IActionResult> GetByUser(string userId)
        {
            var res = await _chatHistoryService.GetAllChatHistories(userId);
            return Ok(res ?? new List<ChatHistoryDTO>());
        }

        [HttpPut("update")]
        public async Task<IActionResult> UpdateAsync(ChatHistoryDTO dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Id) || dto.Messages == null || dto.Messages.Count == 0)
            {
                return BadRequest(new { message = "Invalid update payload: must include at least one message." });
            }

            try
            {
                await _chatHistoryService.UpdateChatHistory(dto);
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }


        [HttpDelete("delete")]
        public async Task<IActionResult> DeleteAsync(string id)
        {
            try
            {
                await _chatHistoryService.DeleteChatHistory(id);
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("ask")]
        public async Task<IActionResult> AskQuestion([FromBody] AskQuestionDTO dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.ChatId) || string.IsNullOrWhiteSpace(dto.Question))
            {
                return BadRequest(new { message = "ChatId and Question are required." });
            }

            try
            {
                var lastMessages = await _chatHistoryService.AskQuestionAsync(dto.ChatId, dto.Question);
                return Ok(lastMessages); 
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("file")]
        public async Task<IActionResult> UpdateFileAsync(string chatId, [FromBody] string fileId)
        {
            if (string.IsNullOrWhiteSpace(chatId) || string.IsNullOrWhiteSpace(fileId))
            {
                return BadRequest(new { message = "ChatId and FileId are required." });
            }

            try
            {
                await _chatHistoryService.AttachFileAsync(chatId, fileId);
                return Ok(new { message = "File attached to chat successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("preview")]
        public async Task<IActionResult> PreviewFile(string chatId, string fileName)
        {
            Console.WriteLine($"chatId: {chatId}, fileName: {fileName}");

            if (string.IsNullOrWhiteSpace(fileName) || string.IsNullOrWhiteSpace(chatId))
            {
                return BadRequest(new { message = "FileName and ChatId are required." });
            }

            try
            {
                var chat = await _chatHistoryService.GetChatHistoryById(chatId);
                if (chat == null)
                return NotFound(new { message = "Chat not found." });

                Console.WriteLine($"chat.UserId: {chat.UserId}");
                Console.WriteLine($"chat.FileIds: {(chat.FileIds == null ? "null" : string.Join(",", chat.FileIds))}");


                var documents = await _documentService.GetDocumentByNameAndUserAsync(fileName, chat.UserId);

                Console.WriteLine($"documents: {(documents == null ? "null" : string.Join(",", documents.Select(d => d.Id)))}");
                if (documents == null || documents.Count == 0)
                {
                    return NotFound(new { message = "Document not found for this user." });
                }

                
                var file = documents.FirstOrDefault(doc => chat.FileIds.Contains(doc.Id));
                if (file == null)
                {
                    return NotFound(new { message = "File is not attached to this chat." });
                }

                if (file.FileData == null || file.FileData.Length == 0)
                {
                    return BadRequest(new { message = "Document found but has no file data." });
                }

                
                return File(file.FileData, "application/pdf", file.FileName);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("file")]
        public async Task<IActionResult> DeleteFileAsync(string chatId, string fileId)
        {
            if (string.IsNullOrWhiteSpace(chatId) || string.IsNullOrWhiteSpace(fileId))
            {
                return BadRequest(new { message = "ChatId and FileId are required." });
            }

            try
            {
                var chat = await _chatHistoryService.GetChatHistoryById(chatId);
                if (chat == null)
                {
                    return NotFound(new { message = "Chat not found." });
                }

                if (!chat.FileIds.Contains(fileId))
                {
                    return NotFound(new { message = "File is not attached to this chat." });
                }

                chat.FileIds.Remove(fileId);
                await _chatHistoryService.UpdateChatHistory(new ChatHistoryDTO
                {
                    Id = chat.Id,
                    UserId = chat.UserId,
                    FileIds = chat.FileIds,
                    Messages = chat.Messages,
                    Title = chat.Title
                });

                return Ok(new { message = "File removed from chat successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

    }
}
